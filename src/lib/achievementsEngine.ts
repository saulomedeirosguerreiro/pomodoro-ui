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

/** Atalho para critérios numéricos simples de um único campo de `AchievementStats`. */
function tier(
  code: string,
  name: string,
  description: string,
  field: keyof AchievementStats,
  target: number,
): AchievementCriterion {
  return {
    code,
    name,
    description,
    evaluate: (ctx) => {
      const value = getStats(ctx)[field]
      return { met: value >= target, progressCurrent: clamp(value, target), progressTarget: target }
    },
  }
}

/**
 * As 50 entradas fixas, replicando `AchievementCatalog.All` (C#) critério a critério e na mesma
 * ordem (é essa ordem que a paginação de `/conquistas` corta em páginas de 10), incluindo
 * `progressCurrent`/`progressTarget` (nulos para critérios binários, igual ao backend).
 */
export const ACHIEVEMENT_CATALOG: readonly AchievementCriterion[] = [
  {
    code: 'primeira_semente',
    name: 'Primeira Semente',
    description: 'Conclua seu primeiro foco.',
    evaluate: (ctx) => ({ met: getStats(ctx).completedFocusCount >= 1, progressCurrent: null, progressTarget: null }),
  },
  tier('constancia_1', 'Primeiro Passo', 'Mantenha uma sequência de 1 dia seguido com foco.', 'longestStreakDays', 1),
  tier('nivel_2', 'Primeiro Broto', 'Chegue ao nível 2.', 'level', 2),
  {
    code: 'primeira_colheita',
    name: 'Primeira Colheita',
    description: 'Conclua sua primeira tarefa.',
    evaluate: (ctx) => ({ met: getStats(ctx).completedTasksCount >= 1, progressCurrent: null, progressTarget: null }),
  },
  tier('descanso_1', 'Primeira Pausa', 'Conclua 1 pausa.', 'completedRestCount', 1),
  tier('pausa_longa_1', 'Primeira Pausa Longa', 'Conclua 1 pausa longa.', 'completedLongBreakCount', 1),
  tier('constancia_3', 'Constância de 3 dias', 'Mantenha uma sequência de 3 dias seguidos com foco.', 'longestStreakDays', 3),
  tier('dia_produtivo_4', 'Dia Produtivo', 'Conclua 4 focos em um único dia.', 'maxFocusInOneDay', 4),
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
  tier('constancia_5', 'Cinco Dias Seguidos', 'Mantenha uma sequência de 5 dias seguidos com foco.', 'longestStreakDays', 5),
  tier('nivel_5', 'Nível 5', 'Chegue ao nível 5.', 'level', 5),
  tier('colheita_5', 'Pequena Colheita', 'Conclua 5 tarefas.', 'completedTasksCount', 5),
  tier('descanso_5', 'Respirando Bem', 'Conclua 5 pausas.', 'completedRestCount', 5),
  tier('pausa_longa_5', 'Recarregando aos Poucos', 'Conclua 5 pausas longas.', 'completedLongBreakCount', 5),
  tier('constancia_7', 'Constância de 7 dias', 'Mantenha uma sequência de 7 dias seguidos com foco.', 'longestStreakDays', 7),
  tier('dia_fertil', 'Dia Fértil', 'Conclua 8 focos em um único dia.', 'maxFocusInOneDay', 8),
  tier('foco_10', 'Aquecendo', 'Conclua 10 focos.', 'completedFocusCount', 10),
  tier('nivel_10', 'Nível 10', 'Chegue ao nível 10.', 'level', 10),
  tier('colheita_10', 'Colheita Farta', 'Conclua 10 tarefas.', 'completedTasksCount', 10),
  tier('descanso_sabio', 'Descanso Sábio', 'Conclua 10 pausas.', 'completedRestCount', 10),
  tier('pausa_longa_10', 'Recarregando', 'Conclua 10 pausas longas.', 'completedLongBreakCount', 10),
  tier('dia_lendario_12', 'Dia Lendário', 'Conclua 12 focos em um único dia.', 'maxFocusInOneDay', 12),
  tier('constancia_14', 'Duas Semanas de Foco', 'Mantenha uma sequência de 14 dias seguidos com foco.', 'longestStreakDays', 14),
  tier('nivel_20', 'Nível 20', 'Chegue ao nível 20.', 'level', 20),
  tier('foco_25', 'Ganhando Ritmo', 'Conclua 25 focos.', 'completedFocusCount', 25),
  tier('colheita_25', 'Produtor Rural', 'Conclua 25 tarefas.', 'completedTasksCount', 25),
  tier('descanso_25', 'Equilíbrio', 'Conclua 25 pausas.', 'completedRestCount', 25),
  tier('pausa_longa_25', 'Equilíbrio Perfeito', 'Conclua 25 pausas longas.', 'completedLongBreakCount', 25),
  tier('constancia_30', 'Constância de 30 dias', 'Mantenha uma sequência de 30 dias seguidos com foco.', 'longestStreakDays', 30),
  tier('nivel_30', 'Nível 30', 'Chegue ao nível 30.', 'level', 30),
  tier('nivel_40', 'Nível 40', 'Chegue ao nível 40.', 'level', 40),
  tier('foco_50', 'Meio Caminho', 'Conclua 50 focos.', 'completedFocusCount', 50),
  tier('nivel_50', 'Nível 50', 'Chegue ao nível 50.', 'level', 50),
  tier('colheita_50', 'Fazendeiro Experiente', 'Conclua 50 tarefas.', 'completedTasksCount', 50),
  tier('descanso_50', 'Mestre do Descanso', 'Conclua 50 pausas.', 'completedRestCount', 50),
  tier('pausa_longa_50', 'Mestre do Descanso Longo', 'Conclua 50 pausas longas.', 'completedLongBreakCount', 50),
  tier('constancia_60', 'Dois Meses Firmes', 'Mantenha uma sequência de 60 dias seguidos com foco.', 'longestStreakDays', 60),
  tier('constancia_90', 'Trimestre Impecável', 'Mantenha uma sequência de 90 dias seguidos com foco.', 'longestStreakDays', 90),
  tier('cem_tomates', 'Cem Tomates', 'Conclua 100 focos.', 'completedFocusCount', 100),
  tier('colheita_100', 'Mestre da Colheita', 'Conclua 100 tarefas.', 'completedTasksCount', 100),
  tier('constancia_180', 'Meio Ano de Disciplina', 'Mantenha uma sequência de 180 dias seguidos com foco.', 'longestStreakDays', 180),
  tier('foco_250', 'Produtividade em Alta', 'Conclua 250 focos.', 'completedFocusCount', 250),
  tier('colheita_250', 'Celeiro Cheio', 'Conclua 250 tarefas.', 'completedTasksCount', 250),
  tier('constancia_365', 'Um Ano Inteiro', 'Mantenha uma sequência de 365 dias seguidos com foco.', 'longestStreakDays', 365),
  tier('foco_500', 'Meio Milhar', 'Conclua 500 focos.', 'completedFocusCount', 500),
  tier('colheita_500', 'Agricultor Lendário', 'Conclua 500 tarefas.', 'completedTasksCount', 500),
  tier('foco_1000', 'Mil Tomates', 'Conclua 1000 focos.', 'completedFocusCount', 1000),
  tier('colheita_1000', 'Mil Tarefas', 'Conclua 1000 tarefas.', 'completedTasksCount', 1000),
  tier('foco_2500', 'Máquina de Foco', 'Conclua 2500 focos.', 'completedFocusCount', 2500),
  tier('foco_5000', 'Lenda do Foco', 'Conclua 5000 focos.', 'completedFocusCount', 5000),
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
