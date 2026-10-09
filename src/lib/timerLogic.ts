import type { PomodoroSession, SessionType } from '../types/api'

/** Valores de fábrica — ponto de partida de `DEFAULT_SETTINGS` e alvo do "Restaurar padrões". */
export const DEFAULT_SESSION_DURATIONS_SECONDS: Record<SessionType, number> = {
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

/**
 * Faixas min/max do modo "Time Blocking Flexível" (Parte 1, D-Q...): espelham
 * `SessionTypeDurations` do backend (Foco 5–120min, DescansoCurto 1–30min, DescansoLongo 5–60min) —
 * aqui simplificadas para uma única faixa de pausa (1–60min), já que `flexibleBreakSessionType`
 * decide o `SessionType` real a partir da duração escolhida.
 */
export const FLEXIBLE_FOCUS_MIN_MINUTES = 5
export const FLEXIBLE_FOCUS_MAX_MINUTES = 120
export const FLEXIBLE_BREAK_MIN_MINUTES = 1
export const FLEXIBLE_BREAK_MAX_MINUTES = 60

export const FLEXIBLE_FOCUS_PRESETS_MINUTES = [5, 10, 15, 25, 30, 45, 60] as const
export const FLEXIBLE_BREAK_PRESETS_MINUTES = [5, 10, 15, 20] as const

/**
 * Faixa min/max por tipo (em minutos), espelhando `SessionTypeDurations` do backend 1:1 (ao
 * contrário de `FLEXIBLE_BREAK_MIN/MAX_MINUTES`, que são uma faixa única simplificada p/ a UI de
 * escolha de duração). Usado para explicar ao usuário por que um bloco ficou fora da faixa
 * permitida (ex.: "Encerrar agora" poucos segundos após iniciar).
 */
export const SESSION_DURATION_RANGE_MINUTES: Record<SessionType, { min: number; max: number }> = {
  foco: { min: 5, max: 120 },
  descanso_curto: { min: 1, max: 30 },
  descanso_longo: { min: 5, max: 60 },
}

/** Converte os 3 campos de duração das Settings (minutos) no mapa de segundos por tipo que o timer consome. */
export function sessionDurationsSecondsFrom(
  focusMinutes: number,
  shortBreakMinutes: number,
  longBreakMinutes: number,
): Record<SessionType, number> {
  return {
    foco: focusMinutes * 60,
    descanso_curto: shortBreakMinutes * 60,
    descanso_longo: longBreakMinutes * 60,
  }
}

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

/**
 * Tempo restante calculado pelo relógio real (RNF-08, US-08 RN-02) — sobrevive a aba em segundo
 * plano. Extraída de `useTimer` para ser reusada por `useFlexibleTimer` sem duplicar a conta.
 */
export function computeRemainingSeconds(
  totalSeconds: number,
  startedAtMs: number,
  pausedAccumulatedMs: number,
  now: number,
): number {
  const elapsedMs = now - startedAtMs - pausedAccumulatedMs
  return Math.max(0, totalSeconds - elapsedMs / 1000)
}

/**
 * Decide o `SessionType` de uma pausa do modo flexível a partir da duração escolhida (minutos):
 * `<= 30` → `descanso_curto`, senão `descanso_longo`. Cobre 1–60min sem buraco, dado que
 * DescansoLongo aceita a partir de 5min no backend e só é escolhido aqui a partir de 31min.
 */
export function flexibleBreakSessionType(minutes: number): SessionType {
  return minutes <= 30 ? 'descanso_curto' : 'descanso_longo'
}
