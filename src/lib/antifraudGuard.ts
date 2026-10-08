import type { PomodoroSession } from '../types/api'

/**
 * Espelha os predicados de antifraude de `CreatePomodoroValidator`/`CreatePomodoroHandler` (C#):
 * data no futuro (com tolerância de relógio) e sobreposição de horário entre sessões do mesmo usuário.
 */

const DEFAULT_FUTURE_TOLERANCE_MS = 60_000

/** Tolerância padrão de 60s, igual ao backend (`CreatePomodoroValidator.FutureToleranceSeconds`). */
export function isTimestampInFuture(iso: string, now: Date, toleranceMs: number = DEFAULT_FUTURE_TOLERANCE_MS): boolean {
  return new Date(iso).getTime() > now.getTime() + toleranceMs
}

/**
 * Mesmo predicado do backend (`PomodoroSessionRepository.ExistsOverlappingAsync`):
 * `existing.startedAt < candidate.completedAt && candidate.startedAt < existing.completedAt`.
 * Intervalos adjacentes (fim de um == início do outro) NÃO se sobrepõem — a comparação é estrita (`<`).
 */
export function overlapsAny(
  candidate: { startedAt: string; completedAt: string },
  existing: readonly PomodoroSession[],
): boolean {
  const candidateStart = new Date(candidate.startedAt).getTime()
  const candidateEnd = new Date(candidate.completedAt).getTime()

  return existing.some((session) => {
    const existingStart = new Date(session.startedAt).getTime()
    const existingEnd = new Date(session.completedAt).getTime()
    return existingStart < candidateEnd && candidateStart < existingEnd
  })
}

export type SessionIntegrityViolation = 'future_timestamp' | 'overlap'

/**
 * Checagem combinada, na mesma ordem do pipeline backend: validação (data futura) roda antes do
 * handler (sobreposição) — por isso `future_timestamp` tem precedência sobre `overlap` aqui também.
 */
export function checkSessionIntegrity(
  candidate: { startedAt: string; completedAt: string },
  existing: readonly PomodoroSession[],
  now: Date,
): SessionIntegrityViolation | null {
  if (isTimestampInFuture(candidate.startedAt, now) || isTimestampInFuture(candidate.completedAt, now)) {
    return 'future_timestamp'
  }

  if (overlapsAny(candidate, existing)) {
    return 'overlap'
  }

  return null
}
