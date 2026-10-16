import type { TFunction } from 'i18next'
import { useCallback, useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { SessionRegistration } from '../components/Timer/useTimer'
import { trackEvent } from '../lib/analytics'
import { getNotificationPermission, requestNotificationPermission, showSessionNotification } from '../lib/notifications'
import { playSessionEndSound } from '../lib/sound'
import { SESSION_DURATION_RANGE_MINUTES, sessionLabel } from '../lib/timerLogic'
import { ApiError } from '../types/api'
import type { PomodoroSession, ProgressSummary, TaskItem } from '../types/api'
import { useDataSource } from './DataSourceContext'
import { useSettings } from './SettingsContext'

export interface RegistrationErrorDescription {
  message: string
  /** `false` para o caso de duração fora da faixa: reenviar o mesmo payload falha sempre do mesmo jeito. */
  retryable: boolean
}

/**
 * Detecta o caso de duração fora da faixa permitida pro tipo — típico de "Encerrar agora"/"Voltar
 * ao foco agora"/trocar de aba no toggle flexível num bloco com poucos segundos decorridos — e
 * explica isso em vez do texto genérico, marcando como não reenviável (já que tentar de novo
 * reenvia a mesma duração e falha do mesmo jeito). Dois backends, dois formatos de erro pro MESMO
 * caso: o remoto manda 422 `validation_error` com `fieldMessage('DurationSeconds')`; o local
 * (`localDataSource.ts`, modo guest) manda 422 `invalid_duration` sem detalhe de campo. Reconhecer
 * só o primeiro formato (como era antes) faz o modo guest cair sempre no texto genérico
 * "tente novamente" — que nunca ajuda aqui, porque reenviar falha de novo com a mesma duração.
 */
export function describeRegistrationError(
  t: TFunction,
  error: unknown,
  registration: SessionRegistration,
): RegistrationErrorDescription {
  const isDurationError =
    error instanceof ApiError &&
    ((error.code === 'validation_error' && error.fieldMessage('DurationSeconds')) || error.code === 'invalid_duration')

  if (isDurationError) {
    const range = SESSION_DURATION_RANGE_MINUTES[registration.type]
    const label = sessionLabel(t, registration.type).toLowerCase()

    if (registration.durationSeconds < range.min * 60) {
      return {
        message: t('timer:errors.durationTooShort', { label, min: range.min }),
        retryable: false,
      }
    }
    if (registration.durationSeconds > range.max * 60) {
      return {
        message: t('timer:errors.durationTooLong', { label, max: range.max }),
        retryable: false,
      }
    }
  }

  return { message: t('timer:errors.generic'), retryable: true }
}

export interface AppEvent {
  id: string
  type: 'level' | 'achievement'
  message: string
  seen: boolean
  /** ISO UTC — momento em que o evento foi registrado (exibido como "Hoje"/"Ontem" na central). */
  createdAt: string
}

/**
 * Infraestrutura de registro de sessão (XP/sementes/conquistas/toast/notificação/som) extraída de
 * `TimerContext` (Parte 4 do plano) para ser compartilhada entre o modo clássico e o modo flexível
 * — refactor mecânico, mesma lógica de antes, char por char. `registerSession` aceita qualquer
 * `SessionRegistration` com campos adicionais (ex.: `mode`/`plannedDurationSeconds`/`addedSeconds`
 * do modo flexível), já que `dataSource.createSession` repassa o payload inteiro.
 */
export function useSessionRegistration() {
  const { t } = useTranslation(['common', 'timer', 'achievements'])
  const { dataSource } = useDataSource()
  const { settings, updateSettings } = useSettings()

  const [lastRegisteredSession, setLastRegisteredSession] = useState<PomodoroSession | null>(null)
  const [registrationError, setRegistrationError] = useState<string | null>(null)
  const [pendingRegistration, setPendingRegistration] = useState<SessionRegistration | null>(null)
  const [progress, setProgress] = useState<ProgressSummary | null>(null)
  const [focusedTask, setFocusedTask] = useState<TaskItem | null>(null)
  const [events, setEvents] = useState<AppEvent[]>([])
  const [totalFociCompleted, setTotalFociCompleted] = useState(0)
  const progressRef = useRef<ProgressSummary | null>(null)
  const focusedTaskRef = useRef<TaskItem | null>(null)
  const unlockedAchievementCodesRef = useRef<Set<string> | null>(null)

  /** US-60: adiciona um evento à central local, sem duplicar pelo mesmo id (ex.: mesmo nível/conquista). */
  const pushEvent = useCallback((event: Omit<AppEvent, 'seen' | 'createdAt'>) => {
    setEvents((prev) => {
      if (prev.some((e) => e.id === event.id)) {
        return prev
      }
      return [{ ...event, seen: false, createdAt: new Date().toISOString() }, ...prev].slice(0, 20)
    })
  }, [])

  const markEventsSeen = useCallback(() => {
    setEvents((prev) => prev.map((event) => ({ ...event, seen: true })))
  }, [])

  const refreshProgress = useCallback(async () => {
    if (!dataSource) return { updated: null, previous: progressRef.current }
    const updated = await dataSource.getProgress()
    const previous = progressRef.current
    progressRef.current = updated
    setProgress(updated)
    return { updated, previous }
  }, [dataSource])

  const refreshFocusedTask = useCallback(() => {
    if (!dataSource) return
    dataSource
      .listTasks('em_curso')
      .then((items) => {
        const next = items[0] ?? null
        focusedTaskRef.current = next
        setFocusedTask(next)
      })
      .catch(() => {
        /* checklist de foco mostra seu próprio estado de erro; o vínculo fica inativo até a próxima tentativa */
      })
  }, [dataSource])

  /** Substitui `user.completedSessions` (US-12 RN-02) — funciona igual em modo conta e modo guest. */
  const refreshTotalFociCompleted = useCallback(async () => {
    if (!dataSource) return
    try {
      const total = await dataSource.getTotalCompletedFocusCount()
      setTotalFociCompleted(total)
    } catch {
      /* usado só para sugerir o próximo tipo de sessão; falha ao buscar mantém o último valor conhecido */
    }
  }, [dataSource])

  /**
   * Busca as conquistas e, se já havia uma linha de base (chamadas após a primeira), mostra um
   * toast para cada conquista nova desbloqueada desde então (US-55).
   */
  const refreshAchievements = useCallback(async () => {
    if (!dataSource) return
    try {
      const items = await dataSource.listAchievements()
      const unlockedCodes = new Set(items.filter((a) => a.unlockedAt).map((a) => a.code))
      const previous = unlockedAchievementCodesRef.current
      unlockedAchievementCodesRef.current = unlockedCodes

      if (previous) {
        const newlyUnlocked = items.find((a) => a.unlockedAt && !previous.has(a.code))
        if (newlyUnlocked) {
          pushEvent({
            id: `achievement-${newlyUnlocked.code}`,
            type: 'achievement',
            message: t('timer:rewards.achievementUnlocked', {
              name: t(`achievements:catalog.${newlyUnlocked.code}.name`),
              description: t(`achievements:catalog.${newlyUnlocked.code}.description`),
            }),
          })
          trackEvent('achievement_unlocked', { achievement_code: newlyUnlocked.code })
        }
      }
    } catch {
      /* conquistas são um bônus; falha ao buscar não deve interromper o registro da sessão */
    }
  }, [dataSource, pushEvent, t])

  useEffect(() => {
    if (dataSource) {
      refreshProgress().catch(() => {
        /* card/pills de progresso mostram seu próprio estado de erro discreto (US-42 CA-002) */
      })
      refreshFocusedTask()
      refreshAchievements()
      refreshTotalFociCompleted()
    }
  }, [dataSource, refreshProgress, refreshFocusedTask, refreshAchievements, refreshTotalFociCompleted])

  // Pede a permissão de notificação proativamente ao carregar o app (uma única vez, enquanto
  // ainda não houver decisão do usuário) — o navegador pode silenciar o pop-up sem gesto prévio,
  // o que é inofensivo: a permissão simplesmente continua 'default' até o usuário decidir.
  useEffect(() => {
    if (getNotificationPermission() !== 'default') {
      return
    }
    requestNotificationPermission()
      .then((result) => {
        if (result === 'granted') {
          updateSettings({ notificationsEnabled: true })
        }
      })
      .catch(() => {
        /* navegador sem suporte ou pedido recusado silenciosamente — nada a fazer aqui */
      })
    // Intencionalmente só no mount — pedir de novo a cada mudança de `updateSettings` reabriria o prompt.
  }, [])

  const registerSession = useCallback(
    async (registration: SessionRegistration) => {
      if (!dataSource) return
      setRegistrationError(null)
      try {
        const taskId = registration.type === 'foco' ? (focusedTaskRef.current?.id ?? undefined) : undefined
        const created = await dataSource.createSession({ ...registration, taskId })
        setLastRegisteredSession(created)
        setPendingRegistration(null)

        const isFocus = registration.type === 'foco'
        const isCompleted = registration.status === 'concluido'
        trackEvent(
          isFocus ? (isCompleted ? 'focus_completed' : 'focus_interrupted') : (isCompleted ? 'break_completed' : 'break_interrupted'),
          { duration_seconds: registration.durationSeconds },
        )

        if (registration.status === 'concluido') {
          // Dispara sempre que foco/pausa (curta ou longa) termina, com a aba focada ou não —
          // só depende da permissão já concedida (CA-002).
          if (settings.notificationsEnabled) {
            const nextAction = t(
              registration.type === 'foco' ? 'timer:notifications.nextActionFocus' : 'timer:notifications.nextActionBreak',
            )
            showSessionNotification(
              t('common:appName'),
              t('timer:notifications.sessionCompleted', { label: sessionLabel(t, registration.type), nextAction }),
            )
          }
          if (settings.sessionEndSoundEnabled) {
            playSessionEndSound()
          }
        }

        if (registration.type === 'foco' && registration.status === 'concluido') {
          await refreshTotalFociCompleted()
          const { updated, previous } = await refreshProgress()
          if (updated && previous) {
            const xp = updated.totalXp - previous.totalXp
            const seeds = updated.seeds - previous.seeds
            const leveledUp = updated.level > previous.level
            const rewardMessage = t('timer:rewards.message', {
              xp,
              seeds,
              seedsLabel: t('common:seedsLabel', { count: seeds }),
            })
            pushEvent({
              id: `reward-${created.id}`,
              type: 'level',
              message: leveledUp ? t('timer:rewards.leveledUp', { rewardMessage, level: updated.level }) : rewardMessage,
            })
            if (leveledUp) {
              trackEvent('level_up', { level: updated.level })
            }
          }
          refreshAchievements()
        }
      } catch (error) {
        const { message, retryable } = describeRegistrationError(t, error, registration)
        setPendingRegistration(retryable ? registration : null)
        setRegistrationError(message)
      }
    },
    [dataSource, refreshTotalFociCompleted, refreshProgress, refreshAchievements, pushEvent, settings, t],
  )

  const retryRegistration = useCallback(() => {
    if (pendingRegistration) {
      registerSession(pendingRegistration)
    }
  }, [pendingRegistration, registerSession])

  const dismissRegistrationError = useCallback(() => {
    setRegistrationError(null)
    setPendingRegistration(null)
  }, [])

  return {
    totalFociCompleted,
    registerSession,
    lastRegisteredSession,
    registrationError,
    retryRegistration,
    dismissRegistrationError,
    canRetryRegistration: pendingRegistration !== null,
    progress,
    focusedTask,
    refreshFocusedTask,
    events,
    markEventsSeen,
  }
}
