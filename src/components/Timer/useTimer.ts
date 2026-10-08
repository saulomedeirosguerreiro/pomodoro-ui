import { useCallback, useEffect, useRef, useState } from 'react'
import { nextSuggestedType, SESSION_DURATIONS_SECONDS } from '../../lib/timerLogic'
import type { SessionStatus, SessionType } from '../../types/api'

export type TimerPhase = 'parado' | 'rodando' | 'pausado'

export interface SessionRegistration {
  type: SessionType
  status: SessionStatus
  durationSeconds: number
  startedAt: string
  completedAt: string
}

interface UseTimerOptions {
  /** Total histórico de focos concluídos (D-Q7), usado só para sugerir o próximo tipo (US-12 RN-02). */
  totalFociCompleted: number
  onSessionReady: (registration: SessionRegistration) => void
}

const TICK_MS = 250

/** Tempo restante calculado pelo relógio real (RNF-08, US-08 RN-02) — sobrevive a aba em segundo plano. */
function computeRemainingSeconds(totalSeconds: number, startedAtMs: number, pausedAccumulatedMs: number, now: number): number {
  const elapsedMs = now - startedAtMs - pausedAccumulatedMs
  return Math.max(0, totalSeconds - elapsedMs / 1000)
}

export function useTimer({ totalFociCompleted, onSessionReady }: UseTimerOptions) {
  const [type, setTypeState] = useState<SessionType>('foco')
  const [phase, setPhase] = useState<TimerPhase>('parado')
  const [remainingSeconds, setRemainingSeconds] = useState(SESSION_DURATIONS_SECONDS.foco)

  const startedAtMsRef = useRef<number | null>(null)
  const pausedAccumulatedMsRef = useRef(0)
  const pauseStartedAtMsRef = useRef<number | null>(null)
  const totalFociRef = useRef(totalFociCompleted)
  totalFociRef.current = totalFociCompleted

  const resetToType = useCallback((nextType: SessionType) => {
    startedAtMsRef.current = null
    pausedAccumulatedMsRef.current = 0
    pauseStartedAtMsRef.current = null
    setTypeState(nextType)
    setPhase('parado')
    setRemainingSeconds(SESSION_DURATIONS_SECONDS[nextType])
  }, [])

  const start = useCallback(() => {
    if (phase !== 'parado') return
    startedAtMsRef.current = Date.now()
    pausedAccumulatedMsRef.current = 0
    setPhase('rodando')
  }, [phase])

  const pause = useCallback(() => {
    if (phase !== 'rodando') return
    pauseStartedAtMsRef.current = Date.now()
    setPhase('pausado')
  }, [phase])

  const resume = useCallback(() => {
    if (phase !== 'pausado' || pauseStartedAtMsRef.current === null) return
    pausedAccumulatedMsRef.current += Date.now() - pauseStartedAtMsRef.current
    pauseStartedAtMsRef.current = null
    setPhase('rodando')
  }, [phase])

  const restart = useCallback(() => {
    resetToType(type)
  }, [resetToType, type])

  /** Registra o período em andamento como `interrompido` com a duração real decorrida. Não faz nada se parado. */
  const registerInterrupted = useCallback(() => {
    if (phase === 'parado' || startedAtMsRef.current === null) return

    const now = Date.now()
    const pausedMs = pausedAccumulatedMsRef.current + (pauseStartedAtMsRef.current ? now - pauseStartedAtMsRef.current : 0)
    const elapsedSeconds = Math.max(1, Math.round((now - startedAtMsRef.current - pausedMs) / 1000))

    onSessionReady({
      type,
      status: 'interrompido',
      durationSeconds: elapsedSeconds,
      startedAt: new Date(startedAtMsRef.current).toISOString(),
      completedAt: new Date(now).toISOString(),
    })
  }, [onSessionReady, phase, type])

  const finalize = useCallback(() => {
    if (phase === 'parado') return
    registerInterrupted()
    resetToType(type)
  }, [phase, registerInterrupted, resetToType, type])

  /**
   * Escolha manual de modo (US-33, G-Q5/G-Q5a): parado troca na hora; rodando/pausado registra
   * o período atual como interrompido antes de trocar. A confirmação é responsabilidade de quem chama.
   */
  const selectType = useCallback((nextType: SessionType) => {
    registerInterrupted()
    resetToType(nextType)
  }, [registerInterrupted, resetToType])

  /**
   * Pular (US-34, G-Q4): parado avança sem registrar; iniciado registra como interrompido e avança.
   * Em ambos os casos o próximo tipo é o sugerido, nunca uma escolha manual.
   */
  const skip = useCallback(() => {
    registerInterrupted()
    resetToType(nextSuggestedType(type, totalFociRef.current))
  }, [registerInterrupted, resetToType, type])

  useEffect(() => {
    if (phase !== 'rodando' || startedAtMsRef.current === null) {
      return
    }

    const intervalId = setInterval(() => {
      const startedAtMs = startedAtMsRef.current
      if (startedAtMs === null) return

      const now = Date.now()
      const remaining = computeRemainingSeconds(
        SESSION_DURATIONS_SECONDS[type],
        startedAtMs,
        pausedAccumulatedMsRef.current,
        now,
      )

      if (remaining <= 0) {
        onSessionReady({
          type,
          status: 'concluido',
          durationSeconds: SESSION_DURATIONS_SECONDS[type],
          startedAt: new Date(startedAtMs).toISOString(),
          completedAt: new Date(now).toISOString(),
        })

        const updatedTotal = type === 'foco' ? totalFociRef.current + 1 : totalFociRef.current
        resetToType(nextSuggestedType(type, updatedTotal))
        return
      }

      setRemainingSeconds(remaining)
    }, TICK_MS)

    return () => clearInterval(intervalId)
  }, [onSessionReady, phase, resetToType, type])

  return {
    type,
    phase,
    remainingSeconds,
    canFinalize: phase !== 'parado',
    start,
    pause,
    resume,
    restart,
    finalize,
    selectType,
    skip,
  }
}
