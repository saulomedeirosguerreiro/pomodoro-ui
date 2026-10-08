import type { PomodoroSession, SessionType } from '../types/api'

export const SESSION_DURATIONS_SECONDS: Record<SessionType, number> = {
  foco: 25 * 60,
  descanso_curto: 5 * 60,
  descanso_longo: 15 * 60,
}

export const SESSION_LABELS: Record<SessionType, string> = {
  foco: 'Foco',
  descanso_curto: 'Pausa curta',
  descanso_longo: 'Pausa longa',
}

export const FOCI_PER_LONG_BREAK = 4

/** Espelha Pomodoro.Domain.Services.PomodoroCycleAdvisor do backend (US-12 RN-02, D-Q5). */
export function nextSuggestedType(completedType: SessionType, totalFociCompletedSoFar: number): SessionType {
  if (completedType !== 'foco') {
    return 'foco'
  }

  const isFourthFocusInCycle = totalFociCompletedSoFar > 0 && totalFociCompletedSoFar % FOCI_PER_LONG_BREAK === 0
  return isFourthFocusInCycle ? 'descanso_longo' : 'descanso_curto'
}

/**
 * "Ciclo N de 4" (US-36, G-Q5b): conta focos concluídos desde a última pausa longa concluída.
 * `sessions` deve vir ordenada da mais recente para a mais antiga (como `GET /api/pomodoros` já retorna).
 */
export function computeCycleCount(sessions: readonly PomodoroSession[]): number {
  let count = 0
  for (const session of sessions) {
    if (session.type === 'descanso_longo' && session.status === 'concluido') {
      break
    }
    if (session.type === 'foco' && session.status === 'concluido') {
      count += 1
    }
  }
  return count
}

export function formatMMSS(totalSeconds: number): string {
  const safeSeconds = Math.max(0, Math.round(totalSeconds))
  const minutes = Math.floor(safeSeconds / 60)
  const seconds = safeSeconds % 60
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
}
