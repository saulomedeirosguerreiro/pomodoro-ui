import type { PomodoroSession, ProgressSummary, SessionStatus, SessionType } from '../types/api'
import { FOCUS_XP, REST_XP, SEEDS_PER_CYCLE_BONUS, SEEDS_PER_FOCUS, XP_PER_LEVEL_MULTIPLIER } from './gameConstants'

/**
 * Espelha Pomodoro.Domain.Services.ProgressRules (C#) — XP, nível, título, streak local e resumo do
 * dia, 100% em TypeScript puro (sem localStorage, sem fetch). Usado pelo modo sem conta para calcular
 * o mesmo `ProgressSummary` que o backend calcularia para quem tem conta.
 */

/**
 * Faixas de título por nível, espelhando `ProgressRules.TitleFor` (C#). Isolada no topo do arquivo
 * para trocar os números sem tocar na lógica de busca. Ordem do maior `minLevel` para o menor —
 * `computeTitleForLevel` usa a primeira faixa cujo `minLevel` o nível atinge.
 */
const LEVEL_TITLE_BANDS: ReadonlyArray<{ minLevel: number; title: string }> = [
  { minLevel: 12, title: 'Guardião do Pomar' },
  { minLevel: 8, title: 'Mestre da Horta' },
  { minLevel: 5, title: 'Horticultor Focado' },
  { minLevel: 3, title: 'Jardineiro Produtivo' },
  { minLevel: 2, title: 'Broto Aprendiz' },
  { minLevel: 1, title: 'Semente Curiosa' },
]

/** Recompensa de UMA sessão, replicando `ProgressRules.XpFor`/`SeedsFor`. */
export function computeSessionReward(type: SessionType, status: SessionStatus): { xp: number; seeds: number } {
  if (status !== 'concluido') {
    return { xp: 0, seeds: 0 }
  }

  const xp = type === 'foco' ? FOCUS_XP : REST_XP
  const seeds = type === 'foco' ? SEEDS_PER_FOCUS : type === 'descanso_longo' ? SEEDS_PER_CYCLE_BONUS : 0
  return { xp, seeds }
}

/** Soma XP e sementes de todo o histórico local. */
export function computeTotals(sessions: readonly PomodoroSession[]): { totalXp: number; seeds: number } {
  let totalXp = 0
  let seeds = 0

  for (const session of sessions) {
    const reward = computeSessionReward(session.type, session.status)
    totalXp += reward.xp
    seeds += reward.seeds
  }

  return { totalXp, seeds }
}

/** Nível por laço iterativo, replicando `ProgressRules.CalculateLevel`: nível N->N+1 custa 200*N XP. */
export function computeLevelInfo(totalXp: number): { level: number; xpInLevel: number; xpForNextLevel: number } {
  let level = 1
  let xpConsumed = 0

  while (true) {
    const xpForThisLevel = XP_PER_LEVEL_MULTIPLIER * level
    if (totalXp - xpConsumed < xpForThisLevel) {
      break
    }
    xpConsumed += xpForThisLevel
    level += 1
  }

  return { level, xpInLevel: totalXp - xpConsumed, xpForNextLevel: XP_PER_LEVEL_MULTIPLIER * level }
}

/** Título por faixa de nível, replicando `ProgressRules.TitleFor`. */
export function computeTitleForLevel(level: number): string {
  const band = LEVEL_TITLE_BANDS.find((entry) => level >= entry.minLevel)
  return band ? band.title : LEVEL_TITLE_BANDS[LEVEL_TITLE_BANDS.length - 1].title
}

/** Data local (`YYYY-MM-DD`) de um instante, no fuso IANA informado — evita parsing manual de fuso. */
function toLocalDateKey(value: Date | string, timeZone: string): string {
  const date = typeof value === 'string' ? new Date(value) : value
  return new Intl.DateTimeFormat('en-CA', { timeZone, year: 'numeric', month: '2-digit', day: '2-digit' }).format(date)
}

/** Soma/subtrai dias de uma chave `YYYY-MM-DD`, em aritmética de calendário pura (sem fuso). */
function addDaysToKey(dateKey: string, days: number): string {
  const [year, month, day] = dateKey.split('-').map(Number)
  const utcDate = new Date(Date.UTC(year, month - 1, day))
  utcDate.setUTCDate(utcDate.getUTCDate() + days)
  return utcDate.toISOString().slice(0, 10)
}

/** Replica `ProgressRules.CalculateStreakDays`: anda para trás a partir de hoje (ou ontem) contando dias consecutivos. */
function calculateStreakDays(activeDates: ReadonlySet<string>, todayKey: string): number {
  let cursor: string
  if (activeDates.has(todayKey)) {
    cursor = todayKey
  } else if (activeDates.has(addDaysToKey(todayKey, -1))) {
    cursor = addDaysToKey(todayKey, -1)
  } else {
    return 0
  }

  let streak = 0
  while (activeDates.has(cursor)) {
    streak += 1
    cursor = addDaysToKey(cursor, -1)
  }

  return streak
}

/**
 * Streak de PROGRESSO (não confundir com o streak de CONQUISTA, que é UTC e fica em
 * `achievementsEngine.ts`). Data local via fuso IANA do navegador.
 *
 * `isStreakAtRiskToday` replica `GetProgressHandler.IsStreakAtRiskToday` do C# ao pé da letra:
 * é `true` sempre que HOJE ainda não teve nenhum foco concluído — mesmo quando não há streak
 * nenhum (streakDays === 0). Não é "streak vivo só por causa de ontem"; é literalmente
 * `!activeDates.has(hoje)`, independente do valor de `streakDays`.
 */
export function computeLocalStreak(
  sessions: readonly PomodoroSession[],
  timeZone: string,
  now: Date = new Date(),
): { streakDays: number; isStreakAtRiskToday: boolean } {
  const activeDates = new Set<string>()
  for (const session of sessions) {
    if (session.type === 'foco' && session.status === 'concluido') {
      activeDates.add(toLocalDateKey(session.completedAt, timeZone))
    }
  }

  const todayKey = toLocalDateKey(now, timeZone)
  return {
    streakDays: calculateStreakDays(activeDates, todayKey),
    isStreakAtRiskToday: !activeDates.has(todayKey),
  }
}

/** Contagem e soma de duração dos focos concluídos HOJE, em data local. */
export function computeTodaySummary(
  sessions: readonly PomodoroSession[],
  timeZone: string,
  now: Date = new Date(),
): { todayFocusCount: number; todayFocusSeconds: number } {
  const todayKey = toLocalDateKey(now, timeZone)
  let todayFocusCount = 0
  let todayFocusSeconds = 0

  for (const session of sessions) {
    if (session.type !== 'foco' || session.status !== 'concluido') {
      continue
    }
    if (toLocalDateKey(session.completedAt, timeZone) === todayKey) {
      todayFocusCount += 1
      todayFocusSeconds += session.durationSeconds
    }
  }

  return { todayFocusCount, todayFocusSeconds }
}

/** Composição final — saída IDÊNTICA em forma a `ProgressSummary` de types/api.ts. */
export function buildProgressSummary(
  sessions: readonly PomodoroSession[],
  timeZone: string,
  now: Date = new Date(),
): ProgressSummary {
  const { totalXp, seeds } = computeTotals(sessions)
  const { level, xpInLevel, xpForNextLevel } = computeLevelInfo(totalXp)
  const { streakDays, isStreakAtRiskToday } = computeLocalStreak(sessions, timeZone, now)
  const { todayFocusCount, todayFocusSeconds } = computeTodaySummary(sessions, timeZone, now)

  return {
    level,
    title: computeTitleForLevel(level),
    xpInLevel,
    xpForNextLevel,
    totalXp,
    seeds,
    streakDays,
    isStreakAtRiskToday,
    todayFocusCount,
    todayFocusSeconds,
  }
}
