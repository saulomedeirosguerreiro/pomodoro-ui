import { useCallback, useEffect, useRef, useState } from 'react'
import {
  computeRemainingSeconds,
  cycleFocusCount,
  DEFAULT_SESSION_DURATIONS_SECONDS,
  nextSuggestedType,
  predictedNextType,
} from '../../lib/timerLogic'
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
  /** Durações configuráveis por tipo (minutos personalizados nas Settings). Default: valores de fábrica. */
  durations?: Record<SessionType, number>
}

const TICK_MS = 250

export function useTimer({ totalFociCompleted, onSessionReady, durations }: UseTimerOptions) {
  // Última configuração de durações conhecida — não dirige a sessão em andamento diretamente,
  // só alimenta o snapshot (`totalSeconds`) na próxima vez que `resetToType` rodar (US: editar
  // as durações em Configurações não deve alterar uma sessão já em curso, só a próxima).
  const durationsRef = useRef(durations ?? DEFAULT_SESSION_DURATIONS_SECONDS)
  durationsRef.current = durations ?? DEFAULT_SESSION_DURATIONS_SECONDS

  const [type, setTypeState] = useState<SessionType>('foco')
  const [phase, setPhase] = useState<TimerPhase>('parado')
  const [totalSeconds, setTotalSeconds] = useState(() => durationsRef.current.foco)
  const [remainingSeconds, setRemainingSeconds] = useState(() => durationsRef.current.foco)

  const startedAtMsRef = useRef<number | null>(null)
  const pausedAccumulatedMsRef = useRef(0)
  const pauseStartedAtMsRef = useRef<number | null>(null)
  const totalFociRef = useRef(totalFociCompleted)
  totalFociRef.current = totalFociCompleted
  const totalSecondsRef = useRef(totalSeconds)
  totalSecondsRef.current = totalSeconds

  const resetToType = useCallback((nextType: SessionType) => {
    startedAtMsRef.current = null
    pausedAccumulatedMsRef.current = 0
    pauseStartedAtMsRef.current = null
    setTypeState(nextType)
    setPhase('parado')
    const total = durationsRef.current[nextType]
    setTotalSeconds(total)
    setRemainingSeconds(total)
  }, [])

  // Resincroniza o countdown exibido quando `durations` muda (settings editadas ou carregadas
  // tardiamente) enquanto o timer está ocioso — sem isso, o mount só refletia a config salva
  // depois de uma troca manual de modo, porque `resetToType` só roda por ação do usuário.
  useEffect(() => {
    if (phase !== 'parado') return
    const total = durationsRef.current[type]
    setTotalSeconds(total)
    setRemainingSeconds(total)
  }, [durations, type, phase])

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

  useEffect(() => {
    if (phase !== 'rodando' || startedAtMsRef.current === null) {
      return
    }

    const intervalId = setInterval(() => {
      const startedAtMs = startedAtMsRef.current
      if (startedAtMs === null) return

      const now = Date.now()
      const remaining = computeRemainingSeconds(
        totalSecondsRef.current,
        startedAtMs,
        pausedAccumulatedMsRef.current,
        now,
      )

      if (remaining <= 0) {
        onSessionReady({
          type,
          status: 'concluido',
          durationSeconds: totalSecondsRef.current,
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

  /** Nunca usa `nextSuggestedType` aqui: o foco atual ainda não foi concluído, então o total não
   *  está incrementado — ver `predictedNextType` pra entender por que isso nunca pode sugerir
   *  pausa longa (senão o 1º foco de um ciclo novo, com o total global já múltiplo de 4 por causa
   *  de ciclos anteriores, seria erradamente marcado como merecendo outra pausa longa). */
  const suggestedNextType = predictedNextType(type)
  /** "Ciclo N de 4" (`TimerDisplay` faz `Math.min(cycleCount + 1, 4)`) — mesmo contador global que
   *  decide `suggestedNextType`, nunca uma janela de histórico (ver `cycleFocusCount`). */
  const cycleCount = cycleFocusCount(totalFociCompleted)

  return {
    type,
    phase,
    remainingSeconds,
    totalSeconds,
    canFinalize: phase !== 'parado',
    /** Único próximo tipo válido na sequência clássica (US-33b) — usado pelo `ModeSwitcher` para
     *  travar a troca manual fora de ordem, além de orientar o avanço automático. */
    suggestedNextType,
    cycleCount,
    start,
    pause,
    resume,
    restart,
    finalize,
    selectType,
  }
}
