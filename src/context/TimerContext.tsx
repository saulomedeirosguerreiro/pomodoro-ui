import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react'
import { useTimer, type SessionRegistration } from '../components/Timer/useTimer'
import { achievementsService } from '../lib/achievementsService'
import { showSessionNotification } from '../lib/notifications'
import { pomodorosService } from '../lib/pomodorosService'
import { progressService } from '../lib/progressService'
import { playSessionEndSound } from '../lib/sound'
import { tasksService } from '../lib/tasksService'
import { SESSION_LABELS } from '../lib/timerLogic'
import type { Achievement, PomodoroSession, ProgressSummary, TaskItem } from '../types/api'
import { useAuth } from './AuthContext'
import { useSettings } from './SettingsContext'

export interface RewardToast {
  xp: number
  seeds: number
  leveledUp: boolean
  newLevel: number
}

export interface AppEvent {
  id: string
  type: 'level' | 'achievement'
  message: string
  seen: boolean
}

interface TimerContextValue extends ReturnType<typeof useTimer> {
  /** Última sessão registrada com sucesso — usado por quem exibe o histórico para atualizar sem refetch. */
  lastRegisteredSession: PomodoroSession | null
  registrationError: string | null
  retryRegistration: () => void
  progress: ProgressSummary | null
  rewardToast: RewardToast | null
  dismissRewardToast: () => void
  focusedTask: TaskItem | null
  refreshFocusedTask: () => void
  achievementToast: Achievement | null
  dismissAchievementToast: () => void
  events: AppEvent[]
  markEventsSeen: () => void
}

const TimerContext = createContext<TimerContextValue | undefined>(undefined)

export function TimerProvider({ children }: { children: ReactNode }) {
  const { user, refreshProfile } = useAuth()
  const { settings } = useSettings()

  const [lastRegisteredSession, setLastRegisteredSession] = useState<PomodoroSession | null>(null)
  const [registrationError, setRegistrationError] = useState<string | null>(null)
  const [pendingRegistration, setPendingRegistration] = useState<SessionRegistration | null>(null)
  const [progress, setProgress] = useState<ProgressSummary | null>(null)
  const [rewardToast, setRewardToast] = useState<RewardToast | null>(null)
  const [focusedTask, setFocusedTask] = useState<TaskItem | null>(null)
  const [achievementToast, setAchievementToast] = useState<Achievement | null>(null)
  const [events, setEvents] = useState<AppEvent[]>([])
  const progressRef = useRef<ProgressSummary | null>(null)
  const focusedTaskRef = useRef<TaskItem | null>(null)
  const unlockedAchievementCodesRef = useRef<Set<string> | null>(null)

  /** US-60: adiciona um evento à central local, sem duplicar pelo mesmo id (ex.: mesmo nível/conquista). */
  const pushEvent = useCallback((event: Omit<AppEvent, 'seen'>) => {
    setEvents((prev) => {
      if (prev.some((e) => e.id === event.id)) {
        return prev
      }
      return [{ ...event, seen: false }, ...prev].slice(0, 20)
    })
  }, [])

  const markEventsSeen = useCallback(() => {
    setEvents((prev) => prev.map((event) => ({ ...event, seen: true })))
  }, [])

  const refreshProgress = useCallback(async () => {
    const updated = await progressService.getMyProgress()
    const previous = progressRef.current
    progressRef.current = updated
    setProgress(updated)
    return { updated, previous }
  }, [])

  const refreshFocusedTask = useCallback(() => {
    tasksService
      .list('em_curso')
      .then((items) => {
        const next = items[0] ?? null
        focusedTaskRef.current = next
        setFocusedTask(next)
      })
      .catch(() => {
        /* checklist de foco mostra seu próprio estado de erro; o vínculo fica inativo até a próxima tentativa */
      })
  }, [])

  /**
   * Busca as conquistas e, se já havia uma linha de base (chamadas após a primeira), mostra um
   * toast para cada conquista nova desbloqueada desde então (US-55).
   */
  const refreshAchievements = useCallback(async () => {
    try {
      const items = await achievementsService.list()
      const unlockedCodes = new Set(items.filter((a) => a.unlockedAt).map((a) => a.code))
      const previous = unlockedAchievementCodesRef.current
      unlockedAchievementCodesRef.current = unlockedCodes

      if (previous) {
        const newlyUnlocked = items.find((a) => a.unlockedAt && !previous.has(a.code))
        if (newlyUnlocked) {
          setAchievementToast(newlyUnlocked)
          pushEvent({
            id: `achievement-${newlyUnlocked.code}`,
            type: 'achievement',
            message: `Conquista desbloqueada: ${newlyUnlocked.name}`,
          })
        }
      }
    } catch {
      /* conquistas são um bônus; falha ao buscar não deve interromper o registro da sessão */
    }
  }, [pushEvent])

  useEffect(() => {
    if (user) {
      refreshProgress().catch(() => {
        /* card/pills de progresso mostram seu próprio estado de erro discreto (US-42 CA-002) */
      })
      refreshFocusedTask()
      refreshAchievements()
    }
  }, [user, refreshProgress, refreshFocusedTask, refreshAchievements])

  const registerSession = useCallback(
    async (registration: SessionRegistration) => {
      setRegistrationError(null)
      try {
        const taskId = registration.type === 'foco' ? (focusedTaskRef.current?.id ?? undefined) : undefined
        const created = await pomodorosService.create({ ...registration, taskId })
        setLastRegisteredSession(created)
        setPendingRegistration(null)

        if (registration.status === 'concluido') {
          // US-59: só com a aba em segundo plano, e só se a permissão já foi concedida (CA-002).
          if (settings.notificationsEnabled && document.hidden) {
            const nextAction = registration.type === 'foco' ? 'Hora de uma pausa.' : 'Hora de focar.'
            showSessionNotification('PomoGarden', `${SESSION_LABELS[registration.type]} concluído! ${nextAction}`)
          }
          if (settings.sessionEndSoundEnabled) {
            playSessionEndSound()
          }
        }

        if (registration.type === 'foco' && registration.status === 'concluido') {
          await refreshProfile()
          const { updated, previous } = await refreshProgress()
          if (previous) {
            const leveledUp = updated.level > previous.level
            setRewardToast({
              xp: updated.totalXp - previous.totalXp,
              seeds: updated.seeds - previous.seeds,
              leveledUp,
              newLevel: updated.level,
            })
            if (leveledUp) {
              pushEvent({ id: `level-${updated.level}`, type: 'level', message: `Nível ${updated.level} alcançado!` })
            }
          }
          refreshAchievements()
        }
      } catch {
        setPendingRegistration(registration)
        setRegistrationError('Não foi possível registrar a sessão. Seus dados não foram perdidos.')
      }
    },
    [refreshProfile, refreshProgress, refreshAchievements, pushEvent, settings],
  )

  const timer = useTimer({
    totalFociCompleted: user?.completedSessions ?? 0,
    onSessionReady: registerSession,
  })

  const retryRegistration = useCallback(() => {
    if (pendingRegistration) {
      registerSession(pendingRegistration)
    }
  }, [pendingRegistration, registerSession])

  const dismissRewardToast = useCallback(() => setRewardToast(null), [])
  const dismissAchievementToast = useCallback(() => setAchievementToast(null), [])

  const value: TimerContextValue = {
    ...timer,
    lastRegisteredSession,
    registrationError,
    retryRegistration,
    progress,
    rewardToast,
    dismissRewardToast,
    focusedTask,
    refreshFocusedTask,
    achievementToast,
    dismissAchievementToast,
    events,
    markEventsSeen,
  }

  return <TimerContext.Provider value={value}>{children}</TimerContext.Provider>
}

export function useTimerContext(): TimerContextValue {
  const context = useContext(TimerContext)
  if (!context) {
    throw new Error('useTimerContext precisa ser usado dentro de um TimerProvider.')
  }
  return context
}
