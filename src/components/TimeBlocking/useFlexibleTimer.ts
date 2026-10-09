import { useCallback, useEffect, useRef, useState } from 'react'
import {
  computeRemainingSeconds,
  FLEXIBLE_BREAK_MAX_MINUTES,
  FLEXIBLE_BREAK_MIN_MINUTES,
  FLEXIBLE_BREAK_PRESETS_MINUTES,
  FLEXIBLE_FOCUS_MAX_MINUTES,
  FLEXIBLE_FOCUS_MIN_MINUTES,
  FLEXIBLE_FOCUS_PRESETS_MINUTES,
  flexibleBreakSessionType,
} from '../../lib/timerLogic'
import type { SessionStatus, SessionType } from '../../types/api'

/**
 * Máquina de estados do modo "Time Blocking Flexível" (Parte 3 do plano) — união discriminada por
 * `kind`, que evita estruturalmente qualquer estado simultâneo/contraditório (só existe um `kind`
 * ativo por vez). Independente de `useTimer`/`TimerContext`: não compartilha estado nem é chamado
 * por eles, só reaproveita `computeRemainingSeconds` (extraída de `useTimer` para `timerLogic.ts`).
 */
export type FlexiblePhase =
  | { kind: 'selecionando_foco' } // tela de escolha de duração do foco
  | { kind: 'foco_rodando' }
  | { kind: 'foco_pausado' }
  | { kind: 'foco_concluido' } // decisão: pausa / outro foco / +tempo / encerrar
  | { kind: 'selecionando_descanso' } // escolha de duração da pausa
  | { kind: 'descanso_rodando' }
  | { kind: 'descanso_pausado' }
  | { kind: 'descanso_concluido' } // decisão: voltar ao foco / encerrar
  | { kind: 'encerrado' } // sessão encerrada, botão volta a selecionando_foco

/** Tipo real de uma pausa flexível, decidido por `flexibleBreakSessionType` — nunca `'foco'`. */
export type FlexibleBreakType = Exclude<SessionType, 'foco'>

export interface FlexibleSessionRegistration {
  type: SessionType
  status: SessionStatus
  durationSeconds: number
  startedAt: string
  completedAt: string
  mode: 'flexivel'
  plannedDurationSeconds: number
  addedSeconds: number
}

interface UseFlexibleTimerOptions {
  onSessionReady: (registration: FlexibleSessionRegistration) => void
}

const TICK_MS = 250
const DEFAULT_FOCUS_DRAFT_MINUTES = FLEXIBLE_FOCUS_PRESETS_MINUTES[0]
const DEFAULT_BREAK_DRAFT_MINUTES = FLEXIBLE_BREAK_PRESETS_MINUTES[0]

const RUNNING_KINDS: readonly FlexiblePhase['kind'][] = ['foco_rodando', 'descanso_rodando']
const PAUSED_KINDS: readonly FlexiblePhase['kind'][] = ['foco_pausado', 'descanso_pausado']
const ACTIVE_BLOCK_KINDS: readonly FlexiblePhase['kind'][] = [...RUNNING_KINDS, ...PAUSED_KINDS]

function clampMinutes(minutes: number, minMinutes: number, maxMinutes: number): number {
  return Math.min(maxMinutes, Math.max(minMinutes, minutes))
}

export function useFlexibleTimer({ onSessionReady }: UseFlexibleTimerOptions) {
  const [phase, setPhase] = useState<FlexiblePhase>({ kind: 'selecionando_foco' })
  const [draftMinutes, setDraftMinutes] = useState<number>(DEFAULT_FOCUS_DRAFT_MINUTES)
  const [totalSeconds, setTotalSeconds] = useState(0)
  const [remainingSeconds, setRemainingSeconds] = useState(0)
  const [addedSeconds, setAddedSeconds] = useState(0)
  /** Tipo real da pausa em curso (`descanso_curto`/`descanso_longo`, decidido por `flexibleBreakSessionType`); `null` fora de um bloco de pausa. */
  const [breakType, setBreakType] = useState<FlexibleBreakType | null>(null)
  const [focusBlocksCompleted, setFocusBlocksCompleted] = useState(0)
  const [totalFocusSecondsCompleted, setTotalFocusSecondsCompleted] = useState(0)

  const startedAtMsRef = useRef<number | null>(null)
  const pausedAccumulatedMsRef = useRef(0)
  const pauseStartedAtMsRef = useRef<number | null>(null)
  const totalSecondsRef = useRef(0)
  const plannedSecondsRef = useRef(0)
  const addedSecondsRef = useRef(0)
  const blockTypeRef = useRef<SessionType>('foco')
  totalSecondsRef.current = totalSeconds

  /** Arma os refs/estado de um novo bloco (foco ou pausa) já em execução — usado por `startFocus`, `startBreak` e pelo encadeamento de `addTime` após `foco_concluido`. */
  const beginBlock = useCallback((type: SessionType, plannedSeconds: number) => {
    startedAtMsRef.current = Date.now()
    pausedAccumulatedMsRef.current = 0
    pauseStartedAtMsRef.current = null
    plannedSecondsRef.current = plannedSeconds
    addedSecondsRef.current = 0
    blockTypeRef.current = type
    totalSecondsRef.current = plannedSeconds
    setTotalSeconds(plannedSeconds)
    setRemainingSeconds(plannedSeconds)
    setAddedSeconds(0)

    if (type === 'foco') {
      setBreakType(null)
      setPhase({ kind: 'foco_rodando' })
    } else {
      setBreakType(type)
      setPhase({ kind: 'descanso_rodando' })
    }
  }, [])

  /** Registra o bloco em andamento como `interrompido` com o tempo real decorrido. Não faz nada se não houver bloco ativo. */
  const registerInterrupted = useCallback(() => {
    if (startedAtMsRef.current === null) return

    const now = Date.now()
    const pausedMs = pausedAccumulatedMsRef.current + (pauseStartedAtMsRef.current ? now - pauseStartedAtMsRef.current : 0)
    const elapsedSeconds = Math.max(1, Math.round((now - startedAtMsRef.current - pausedMs) / 1000))

    onSessionReady({
      type: blockTypeRef.current,
      status: 'interrompido',
      durationSeconds: elapsedSeconds,
      startedAt: new Date(startedAtMsRef.current).toISOString(),
      completedAt: new Date(now).toISOString(),
      mode: 'flexivel',
      plannedDurationSeconds: plannedSecondsRef.current,
      addedSeconds: addedSecondsRef.current,
    })
  }, [onSessionReady])

  /** Volta para a tela de escolha de foco, limpando todo o estado de bloco (usado por fim de pausa e início de nova sessão). */
  const resetToSelectingFocus = useCallback(() => {
    startedAtMsRef.current = null
    pausedAccumulatedMsRef.current = 0
    pauseStartedAtMsRef.current = null
    setBreakType(null)
    setDraftMinutes(DEFAULT_FOCUS_DRAFT_MINUTES)
    setPhase({ kind: 'selecionando_foco' })
  }, [])

  const chooseFocusPreset = useCallback(
    (minutes: number) => {
      if (phase.kind !== 'selecionando_foco') return
      setDraftMinutes(minutes)
    },
    [phase.kind],
  )

  const chooseFocusCustom = useCallback(
    (minutes: number) => {
      if (phase.kind !== 'selecionando_foco') return
      setDraftMinutes(clampMinutes(minutes, FLEXIBLE_FOCUS_MIN_MINUTES, FLEXIBLE_FOCUS_MAX_MINUTES))
    },
    [phase.kind],
  )

  const startFocus = useCallback(() => {
    if (phase.kind !== 'selecionando_foco') return
    beginBlock('foco', draftMinutes * 60)
  }, [phase.kind, draftMinutes, beginBlock])

  const pause = useCallback(() => {
    if (!RUNNING_KINDS.includes(phase.kind)) return
    pauseStartedAtMsRef.current = Date.now()
    setPhase({ kind: phase.kind === 'foco_rodando' ? 'foco_pausado' : 'descanso_pausado' })
  }, [phase.kind])

  const resume = useCallback(() => {
    if (!PAUSED_KINDS.includes(phase.kind) || pauseStartedAtMsRef.current === null) return
    pausedAccumulatedMsRef.current += Date.now() - pauseStartedAtMsRef.current
    pauseStartedAtMsRef.current = null
    setPhase({ kind: phase.kind === 'foco_pausado' ? 'foco_rodando' : 'descanso_rodando' })
  }, [phase.kind])

  /**
   * "+tempo" (+5/+10min). Durante um foco rodando/pausado, estica o alvo sem reiniciar nada.
   * Decisão de design (Parte 3 do plano): como o backend não tem endpoint de update de sessão,
   * "+tempo" depois do foco já ter concluído naturalmente (e já ter sido registrado) não pode
   * continuar o mesmo registro — vira um NOVO bloco de foco encadeado, já rodando, com os segundos
   * adicionados como duração planejada. Do ponto de vista da pessoa, a tela não volta para a
   * seleção de duração; o foco simplesmente continua contando.
   */
  const addTime = useCallback(
    (seconds: number) => {
      if (phase.kind === 'foco_rodando' || phase.kind === 'foco_pausado') {
        addedSecondsRef.current += seconds
        totalSecondsRef.current += seconds
        setTotalSeconds(totalSecondsRef.current)
        setAddedSeconds(addedSecondsRef.current)
        if (phase.kind === 'foco_pausado') {
          setRemainingSeconds((prev) => prev + seconds)
        }
        return
      }

      if (phase.kind === 'foco_concluido') {
        beginBlock('foco', seconds)
      }
    },
    [phase.kind, beginBlock],
  )

  /** "Encerrar agora": registra o bloco ativo como interrompido e encerra a sessão toda. */
  const endCurrentBlockNow = useCallback(() => {
    if (!ACTIVE_BLOCK_KINDS.includes(phase.kind)) return
    registerInterrupted()
    setPhase({ kind: 'encerrado' })
  }, [phase.kind, registerInterrupted])

  /**
   * Fluxo de iniciar uma pausa — duas etapas reaproveitando o mesmo nome (espelha o plano):
   * a partir de `foco_concluido` abre a tela de seleção de duração; a partir de
   * `selecionando_descanso` confirma a duração escolhida e já põe a pausa para rodar.
   */
  const startBreak = useCallback(() => {
    if (phase.kind === 'foco_concluido') {
      setDraftMinutes(DEFAULT_BREAK_DRAFT_MINUTES)
      setPhase({ kind: 'selecionando_descanso' })
      return
    }

    if (phase.kind === 'selecionando_descanso') {
      beginBlock(flexibleBreakSessionType(draftMinutes), draftMinutes * 60)
    }
  }, [phase.kind, draftMinutes, beginBlock])

  const startAnotherFocus = useCallback(() => {
    if (phase.kind !== 'foco_concluido') return
    resetToSelectingFocus()
  }, [phase.kind, resetToSelectingFocus])

  /** Encerra a sessão a partir de uma decisão pós-bloco — o bloco já foi registrado como `concluido` ao chegar a zero, então só fecha a tela. */
  const endSession = useCallback(() => {
    if (phase.kind !== 'foco_concluido' && phase.kind !== 'descanso_concluido') return
    setPhase({ kind: 'encerrado' })
  }, [phase.kind])

  const chooseBreakPreset = useCallback(
    (minutes: number) => {
      if (phase.kind !== 'selecionando_descanso') return
      setDraftMinutes(minutes)
    },
    [phase.kind],
  )

  const chooseBreakCustom = useCallback(
    (minutes: number) => {
      if (phase.kind !== 'selecionando_descanso') return
      setDraftMinutes(clampMinutes(minutes, FLEXIBLE_BREAK_MIN_MINUTES, FLEXIBLE_BREAK_MAX_MINUTES))
    },
    [phase.kind],
  )

  /** "Voltar ao foco agora": pula o resto da pausa, registrando-a como interrompida. */
  const backToFocusNow = useCallback(() => {
    if (phase.kind !== 'descanso_rodando' && phase.kind !== 'descanso_pausado') return
    registerInterrupted()
    resetToSelectingFocus()
  }, [phase.kind, registerInterrupted, resetToSelectingFocus])

  /** A partir de `descanso_concluido`: a pausa já foi registrada como `concluido`, só volta para a seleção de foco. */
  const backToFocus = useCallback(() => {
    if (phase.kind !== 'descanso_concluido') return
    resetToSelectingFocus()
  }, [phase.kind, resetToSelectingFocus])

  const startNewSession = useCallback(() => {
    if (phase.kind !== 'encerrado') return
    setFocusBlocksCompleted(0)
    setTotalFocusSecondsCompleted(0)
    resetToSelectingFocus()
  }, [phase.kind, resetToSelectingFocus])

  // Conclusão natural (tick a cada 250ms, mesmo padrão de `useTimer`): ao chegar a 0, registra o
  // bloco como `concluido` com a duração total (planejada + adicionada) e vai para `foco_concluido`
  // ou `descanso_concluido` — nunca avança sozinho para o próximo bloco.
  useEffect(() => {
    if (!RUNNING_KINDS.includes(phase.kind) || startedAtMsRef.current === null) {
      return
    }

    const intervalId = setInterval(() => {
      const startedAtMs = startedAtMsRef.current
      if (startedAtMs === null) return

      const now = Date.now()
      const remaining = computeRemainingSeconds(totalSecondsRef.current, startedAtMs, pausedAccumulatedMsRef.current, now)

      if (remaining <= 0) {
        const completedType = blockTypeRef.current
        // Limpa o ref sincronamente (igual a `resetToType` em `useTimer`) — evita que o mesmo
        // `setInterval` dispare `onSessionReady` de novo antes do próximo render aplicar o novo
        // `phase` (fake timers/React podem processar vários ticks antes de re-renderizar).
        startedAtMsRef.current = null
        onSessionReady({
          type: completedType,
          status: 'concluido',
          durationSeconds: totalSecondsRef.current,
          startedAt: new Date(startedAtMs).toISOString(),
          completedAt: new Date(now).toISOString(),
          mode: 'flexivel',
          plannedDurationSeconds: plannedSecondsRef.current,
          addedSeconds: addedSecondsRef.current,
        })

        if (completedType === 'foco') {
          setFocusBlocksCompleted((prev) => prev + 1)
          setTotalFocusSecondsCompleted((prev) => prev + totalSecondsRef.current)
          setPhase({ kind: 'foco_concluido' })
        } else {
          setPhase({ kind: 'descanso_concluido' })
        }
        setRemainingSeconds(0)
        return
      }

      setRemainingSeconds(remaining)
    }, TICK_MS)

    return () => clearInterval(intervalId)
  }, [onSessionReady, phase.kind])

  return {
    phase,
    draftMinutes,
    totalSeconds,
    remainingSeconds,
    addedSeconds,
    breakType,
    focusBlocksCompleted,
    totalFocusSecondsCompleted,
    chooseFocusPreset,
    chooseFocusCustom,
    startFocus,
    pause,
    resume,
    addTime,
    endCurrentBlockNow,
    startBreak,
    startAnotherFocus,
    endSession,
    chooseBreakPreset,
    chooseBreakCustom,
    backToFocusNow,
    backToFocus,
    startNewSession,
  }
}
