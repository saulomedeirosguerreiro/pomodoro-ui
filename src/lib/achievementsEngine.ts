import type { Achievement, PomodoroSession, TaskItem } from '../types/api'

/**
 * Espelha `Pomodoro.Domain.Achievements.AchievementCatalog` + `AchievementCalculator` (C#) — catálogo
 * fixo das 10 conquistas e o streak "de conquista", que é deliberadamente calculado em DATA UTC.
 *
 * Nota (D8 do plano consolidado): o streak aqui é UTC de propósito, igual ao backend — é uma
 * inconsistência proposital em relação ao streak de PROGRESSO (`progressEngine.computeLocalStreak`,
 * que é em data local). NÃO "consertar" aqui, ou vira uma terceira variante divergente entre os dois
 * lados (backend/frontend) e os dois conceitos (progresso/conquista).
 */

export interface AchievementContext {
  sessions: readonly PomodoroSession[]
  tasks: readonly TaskItem[]
  level: number
  now?: Date
}

export interface AchievementCriterion {
  code: string
  name: string
  description: string
  /** `progressCurrent`/`progressTarget` nulos quando o critério é binário (não numérico). */
  evaluate: (ctx: AchievementContext) => { met: boolean; progressCurrent: number | null; progressTarget: number | null }
}

interface AchievementStats {
  completedFocusCount: number
  completedLongBreakCount: number
  completedRestCount: number
  maxFocusInOneDay: number
  longestStreakDays: number
  level: number
  completedTasksCount: number
}

/** Data UTC (`YYYY-MM-DD`) de um instante — `toISOString` sempre normaliza para UTC. */
function toUtcDateKey(iso: string): string {
  return new Date(iso).toISOString().slice(0, 10)
}

function isNextUtcDay(dayKey: string, nextKey: string): boolean {
  const [year, month, day] = dayKey.split('-').map(Number)
  const date = new Date(Date.UTC(year, month - 1, day))
  date.setUTCDate(date.getUTCDate() + 1)
  return date.toISOString().slice(0, 10) === nextKey
}

/** Maior sequência de dias UTC consecutivos com ao menos um foco, replicando `AchievementCalculator.LongestStreakDays`. */
function longestConsecutiveUtcStreak(activeDates: ReadonlySet<string>): number {
  if (activeDates.size === 0) {
    return 0
  }

  const sortedDates = Array.from(activeDates).sort()
  let longest = 1
  let current = 1

  for (let i = 1; i < sortedDates.length; i += 1) {
    if (isNextUtcDay(sortedDates[i - 1], sortedDates[i])) {
      current += 1
      longest = Math.max(longest, current)
    } else {
      current = 1
    }
  }

  return longest
}

/**
 * MAIOR streak de foco já atingido na história (não o atual), em DATA UTC — replica a inconsistência
 * proposital que já existe no backend entre o streak de progresso (local) e o streak de conquista (UTC).
 */
export function computeMaxUtcStreak(sessions: readonly PomodoroSession[]): number {
  const activeDates = new Set<string>()
  for (const session of sessions) {
    if (session.type === 'foco' && session.status === 'concluido') {
      activeDates.add(toUtcDateKey(session.completedAt))
    }
  }
  return longestConsecutiveUtcStreak(activeDates)
}

/** Maior contagem de focos concluídos num único dia UTC — base de "Dia Fértil" (threshold 8). */
export function computeBestUtcDayFocusCount(sessions: readonly PomodoroSession[]): number {
  const focusCountByDay = new Map<string, number>()
  for (const session of sessions) {
    if (session.type === 'foco' && session.status === 'concluido') {
      const day = toUtcDateKey(session.completedAt)
      focusCountByDay.set(day, (focusCountByDay.get(day) ?? 0) + 1)
    }
  }
  return focusCountByDay.size === 0 ? 0 : Math.max(...focusCountByDay.values())
}

/** Replica `AchievementCalculator.BuildStats`. Memoizada por `ctx` em `evaluateAchievements` — cada critério não recalcula. */
function buildStats(ctx: AchievementContext): AchievementStats {
  let completedFocusCount = 0
  let completedLongBreakCount = 0
  let completedRestCount = 0
  const focusCountByDay = new Map<string, number>()

  for (const session of ctx.sessions) {
    if (session.status !== 'concluido') {
      continue
    }

    if (session.type === 'foco') {
      completedFocusCount += 1
      const day = toUtcDateKey(session.completedAt)
      focusCountByDay.set(day, (focusCountByDay.get(day) ?? 0) + 1)
    } else {
      completedRestCount += 1
      if (session.type === 'descanso_longo') {
        completedLongBreakCount += 1
      }
    }
  }

  const maxFocusInOneDay = focusCountByDay.size === 0 ? 0 : Math.max(...focusCountByDay.values())
  const longestStreakDays = longestConsecutiveUtcStreak(new Set(focusCountByDay.keys()))
  const completedTasksCount = ctx.tasks.filter((task) => task.status === 'feito').length

  return {
    completedFocusCount,
    completedLongBreakCount,
    completedRestCount,
    maxFocusInOneDay,
    longestStreakDays,
    level: ctx.level,
    completedTasksCount,
  }
}

const statsCache = new WeakMap<AchievementContext, AchievementStats>()

/** `buildStats` é pura, mas cara (varre sessões); memoizar por `ctx` evita recalcular 10x em `evaluateAchievements`. */
function getStats(ctx: AchievementContext): AchievementStats {
  let stats = statsCache.get(ctx)
  if (!stats) {
    stats = buildStats(ctx)
    statsCache.set(ctx, stats)
  }
  return stats
}

function clamp(value: number, target: number): number {
  return Math.min(value, target)
}

/**
 * As 10 entradas fixas, replicando `AchievementCatalog.All` (C#) critério a critério, incluindo
 * `progressCurrent`/`progressTarget` (nulos para critérios binários, igual ao backend).
 */
export const ACHIEVEMENT_CATALOG: readonly AchievementCriterion[] = [
  {
    code: 'primeira_semente',
    name: 'Primeira Semente',
    description: 'Conclua seu primeiro foco.',
    evaluate: (ctx) => ({ met: getStats(ctx).completedFocusCount >= 1, progressCurrent: null, progressTarget: null }),
  },
  {
    code: 'ciclo_completo',
    name: 'Ciclo Completo',
    description: 'Conclua 4 focos e uma pausa longa.',
    evaluate: (ctx) => {
      const stats = getStats(ctx)
      return {
        met: stats.completedFocusCount >= 4 && stats.completedLongBreakCount >= 1,
        progressCurrent: null,
        progressTarget: null,
      }
    },
  },
  {
    code: 'dia_fertil',
    name: 'Dia Fértil',
    description: 'Conclua 8 focos em um único dia.',
    evaluate: (ctx) => {
      const stats = getStats(ctx)
      return { met: stats.maxFocusInOneDay >= 8, progressCurrent: clamp(stats.maxFocusInOneDay, 8), progressTarget: 8 }
    },
  },
  {
    code: 'constancia_3',
    name: 'Constância de 3 dias',
    description: 'Mantenha uma sequência de 3 dias seguidos com foco.',
    evaluate: (ctx) => {
      const stats = getStats(ctx)
      return { met: stats.longestStreakDays >= 3, progressCurrent: clamp(stats.longestStreakDays, 3), progressTarget: 3 }
    },
  },
  {
    code: 'constancia_7',
    name: 'Constância de 7 dias',
    description: 'Mantenha uma sequência de 7 dias seguidos com foco.',
    evaluate: (ctx) => {
      const stats = getStats(ctx)
      return { met: stats.longestStreakDays >= 7, progressCurrent: clamp(stats.longestStreakDays, 7), progressTarget: 7 }
    },
  },
  {
    code: 'constancia_30',
    name: 'Constância de 30 dias',
    description: 'Mantenha uma sequência de 30 dias seguidos com foco.',
    evaluate: (ctx) => {
      const stats = getStats(ctx)
      return { met: stats.longestStreakDays >= 30, progressCurrent: clamp(stats.longestStreakDays, 30), progressTarget: 30 }
    },
  },
  {
    code: 'primeira_colheita',
    name: 'Primeira Colheita',
    description: 'Conclua sua primeira tarefa.',
    evaluate: (ctx) => ({ met: getStats(ctx).completedTasksCount >= 1, progressCurrent: null, progressTarget: null }),
  },
  {
    code: 'cem_tomates',
    name: 'Cem Tomates',
    description: 'Conclua 100 focos.',
    evaluate: (ctx) => {
      const stats = getStats(ctx)
      return { met: stats.completedFocusCount >= 100, progressCurrent: clamp(stats.completedFocusCount, 100), progressTarget: 100 }
    },
  },
  {
    code: 'nivel_5',
    name: 'Nível 5',
    description: 'Chegue ao nível 5.',
    evaluate: (ctx) => {
      const stats = getStats(ctx)
      return { met: stats.level >= 5, progressCurrent: clamp(stats.level, 5), progressTarget: 5 }
    },
  },
  {
    code: 'descanso_sabio',
    name: 'Descanso Sábio',
    description: 'Conclua 10 pausas.',
    evaluate: (ctx) => {
      const stats = getStats(ctx)
      return { met: stats.completedRestCount >= 10, progressCurrent: clamp(stats.completedRestCount, 10), progressTarget: 10 }
    },
  },
]

/**
 * Combina o catálogo com o estado JÁ desbloqueado (ledger, vem da Frente 2) para produzir
 * `Achievement[]` no formato de types/api.ts. É pura: não decide o que persistir, só calcula.
 *
 * Regra de `unlockedAt`: se o código já está no ledger, mantém a data histórica congelada (nunca
 * recalcula). Se NÃO está no ledger mas o critério está `met` agora, calcula a data "ao vivo" como
 * `now` — é essa mesma data que a camada de storage (`localAchievementsStore`, Frente 2) deve gravar
 * no ledger ao detectar `met && !ledger.has(code)`, para não ter que recalcular o timestamp duas vezes.
 */
export function evaluateAchievements(
  ctx: AchievementContext,
  unlockedLedger: ReadonlyMap<string, string>,
): Achievement[] {
  const now = ctx.now ?? new Date()

  return ACHIEVEMENT_CATALOG.map((criterion) => {
    const result = criterion.evaluate(ctx)
    const previouslyUnlockedAt = unlockedLedger.get(criterion.code) ?? null
    const unlockedAt = previouslyUnlockedAt ?? (result.met ? now.toISOString() : null)

    return {
      code: criterion.code,
      name: criterion.name,
      description: criterion.description,
      unlockedAt,
      progressCurrent: result.progressCurrent,
      progressTarget: result.progressTarget,
    }
  })
}
