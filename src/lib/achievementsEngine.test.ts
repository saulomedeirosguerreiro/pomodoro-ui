import { describe, expect, it } from 'vitest'
import type { PomodoroSession, TaskItem } from '../types/api'
import { computeLocalStreak } from './progressEngine'
import {
  ACHIEVEMENT_CATALOG,
  computeBestUtcDayFocusCount,
  computeMaxUtcStreak,
  evaluateAchievements,
  type AchievementContext,
} from './achievementsEngine'

function session(overrides: Partial<PomodoroSession>): PomodoroSession {
  return {
    id: 1,
    type: 'foco',
    status: 'concluido',
    durationSeconds: 1500,
    startedAt: '2026-01-01T10:00:00Z',
    completedAt: '2026-01-01T10:25:00Z',
    createdAt: '2026-01-01T10:25:00Z',
    ...overrides,
  }
}

function task(overrides: Partial<TaskItem>): TaskItem {
  return {
    id: 1,
    title: 'Tarefa',
    description: null,
    priority: 'media',
    estimatedPomodoros: 1,
    completedPomodoros: 0,
    status: 'a_fazer',
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
    ...overrides,
  }
}

function focusSessionOnUtcDay(id: number, utcDay: string): PomodoroSession {
  return session({ id, completedAt: `${utcDay}T12:00:00Z` })
}

describe('computeMaxUtcStreak', () => {
  it('sem sessões, streak 0', () => {
    expect(computeMaxUtcStreak([])).toBe(0)
  })

  it('maior streak HISTÓRICO, não o atual — streak antigo de 5 dias vence um atual de 1', () => {
    const sessions = [
      focusSessionOnUtcDay(1, '2026-01-01'),
      focusSessionOnUtcDay(2, '2026-01-02'),
      focusSessionOnUtcDay(3, '2026-01-03'),
      focusSessionOnUtcDay(4, '2026-01-04'),
      focusSessionOnUtcDay(5, '2026-01-05'),
      // gap
      focusSessionOnUtcDay(6, '2026-01-20'),
    ]
    expect(computeMaxUtcStreak(sessions)).toBe(5)
  })

  it('foco interrompido não entra na contagem', () => {
    const sessions = [session({ status: 'interrompido' })]
    expect(computeMaxUtcStreak(sessions)).toBe(0)
  })

  it('pausas não contam para o streak de conquista', () => {
    const sessions = [session({ type: 'descanso_longo' })]
    expect(computeMaxUtcStreak(sessions)).toBe(0)
  })
})

describe('computeBestUtcDayFocusCount', () => {
  it('conta o dia UTC com mais focos concluídos', () => {
    const sessions = [
      session({ id: 1, completedAt: '2026-01-01T08:00:00Z' }),
      session({ id: 2, completedAt: '2026-01-01T12:00:00Z' }),
      session({ id: 3, completedAt: '2026-01-02T08:00:00Z' }),
    ]
    expect(computeBestUtcDayFocusCount(sessions)).toBe(2)
  })

  it('sem sessões, 0', () => {
    expect(computeBestUtcDayFocusCount([])).toBe(0)
  })
})

describe('streak UTC (conquista) vs. streak local (progresso) divergindo perto da virada de dia', () => {
  it('23h59 em fuso UTC-3 já é o dia seguinte em UTC — os dois streaks contam dias diferentes de propósito', () => {
    // 2026-01-05T02:59:00Z = 2026-01-04 23:59 em America/Sao_Paulo (UTC-3).
    // Em UTC, essa sessão é do dia 05/01. Em data local (America/Sao_Paulo), é do dia 04/01.
    const sessions = [session({ completedAt: '2026-01-05T02:59:00Z' })]

    const utcStreak = computeMaxUtcStreak(sessions)
    const localStreak = computeLocalStreak(sessions, 'America/Sao_Paulo', new Date('2026-01-05T12:00:00Z'))

    // Streak de conquista (UTC): a sessão conta para o dia 05/01 UTC.
    expect(utcStreak).toBe(1)
    // Streak de progresso (local): "hoje" local é 05/01 (now=12h local), mas a sessão foi registrada
    // em 04/01 local — ou seja, NÃO conta como "hoje" local, só como "ontem" local.
    expect(localStreak).toEqual({ streakDays: 1, isStreakAtRiskToday: true })
    // A demonstração da divergência proposital: os dois streaks concordam em "1" aqui, mas por
    // CRITÉRIOS DE DATA DIFERENTES (um UTC, outro local) — não é coincidência que ambas deem 1 numa
    // única sessão; o que importa é que cada um classifica a MESMA sessão num "dia" diferente.
  })
})

describe('ACHIEVEMENT_CATALOG — catálogo fixo com os 10 códigos esperados', () => {
  it('tem exatamente os 10 códigos, na ordem documentada', () => {
    expect(ACHIEVEMENT_CATALOG.map((c) => c.code)).toEqual([
      'primeira_semente',
      'ciclo_completo',
      'dia_fertil',
      'constancia_3',
      'constancia_7',
      'constancia_30',
      'primeira_colheita',
      'cem_tomates',
      'nivel_5',
      'descanso_sabio',
    ])
  })
})

describe('evaluateAchievements — critérios individuais', () => {
  const baseCtx = (overrides: Partial<AchievementContext>): AchievementContext => ({
    sessions: [],
    tasks: [],
    level: 1,
    now: new Date('2026-01-10T12:00:00Z'),
    ...overrides,
  })

  function findResult(ctx: AchievementContext, code: string) {
    const criterion = ACHIEVEMENT_CATALOG.find((c) => c.code === code)
    if (!criterion) throw new Error(`critério não encontrado: ${code}`)
    return criterion.evaluate(ctx)
  }

  it('primeira_semente: met só com >= 1 foco concluído', () => {
    expect(findResult(baseCtx({ sessions: [] }), 'primeira_semente').met).toBe(false)
    expect(findResult(baseCtx({ sessions: [session({})] }), 'primeira_semente').met).toBe(true)
  })

  it('ciclo_completo: precisa de 4 focos E 1 pausa longa, ambos concluídos', () => {
    const fourFocusNoLongBreak = baseCtx({
      sessions: [1, 2, 3, 4].map((id) => session({ id })),
    })
    expect(findResult(fourFocusNoLongBreak, 'ciclo_completo').met).toBe(false)

    const fourFocusWithLongBreak = baseCtx({
      sessions: [...[1, 2, 3, 4].map((id) => session({ id })), session({ id: 5, type: 'descanso_longo' })],
    })
    expect(findResult(fourFocusWithLongBreak, 'ciclo_completo').met).toBe(true)
  })

  it('dia_fertil: 8 focos no mesmo dia UTC, progresso limitado ao alvo (8)', () => {
    const sevenInOneDay = baseCtx({
      sessions: Array.from({ length: 7 }, (_, i) => focusSessionOnUtcDay(i + 1, '2026-01-01')),
    })
    const seven = findResult(sevenInOneDay, 'dia_fertil')
    expect(seven).toEqual({ met: false, progressCurrent: 7, progressTarget: 8 })

    const tenInOneDay = baseCtx({
      sessions: Array.from({ length: 10 }, (_, i) => focusSessionOnUtcDay(i + 1, '2026-01-01')),
    })
    const ten = findResult(tenInOneDay, 'dia_fertil')
    expect(ten).toEqual({ met: true, progressCurrent: 8, progressTarget: 8 })
  })

  it('constancia_3/7/30: usam o maior streak HISTÓRICO (UTC), não o atual', () => {
    const sessions = ['2026-01-01', '2026-01-02', '2026-01-03'].map((day, i) => focusSessionOnUtcDay(i + 1, day))
    const ctx = baseCtx({ sessions })

    expect(findResult(ctx, 'constancia_3')).toEqual({ met: true, progressCurrent: 3, progressTarget: 3 })
    expect(findResult(ctx, 'constancia_7')).toEqual({ met: false, progressCurrent: 3, progressTarget: 7 })
    expect(findResult(ctx, 'constancia_30')).toEqual({ met: false, progressCurrent: 3, progressTarget: 30 })
  })

  it('primeira_colheita: met só com >= 1 tarefa feito', () => {
    expect(findResult(baseCtx({ tasks: [task({ status: 'a_fazer' })] }), 'primeira_colheita').met).toBe(false)
    expect(findResult(baseCtx({ tasks: [task({ status: 'feito' })] }), 'primeira_colheita').met).toBe(true)
  })

  it('cem_tomates: fronteira exata 99 -> não met, 100 -> met', () => {
    const ninetyNine = baseCtx({
      sessions: Array.from({ length: 99 }, (_, i) => session({ id: i + 1, completedAt: `2026-01-01T0${i % 9}:00:00Z` })),
    })
    expect(findResult(ninetyNine, 'cem_tomates')).toEqual({ met: false, progressCurrent: 99, progressTarget: 100 })

    const oneHundred = baseCtx({
      sessions: Array.from({ length: 100 }, (_, i) => session({ id: i + 1, completedAt: `2026-01-01T0${i % 9}:00:00Z` })),
    })
    expect(findResult(oneHundred, 'cem_tomates')).toEqual({ met: true, progressCurrent: 100, progressTarget: 100 })
  })

  it('nivel_5: usa ctx.level diretamente, fronteira exata 4 -> não met, 5 -> met', () => {
    expect(findResult(baseCtx({ level: 4 }), 'nivel_5')).toEqual({ met: false, progressCurrent: 4, progressTarget: 5 })
    expect(findResult(baseCtx({ level: 5 }), 'nivel_5')).toEqual({ met: true, progressCurrent: 5, progressTarget: 5 })
  })

  it('descanso_sabio: 10 pausas concluídas, de qualquer tipo', () => {
    const nine = baseCtx({
      sessions: Array.from({ length: 9 }, (_, i) => session({ id: i + 1, type: 'descanso_curto' })),
    })
    expect(findResult(nine, 'descanso_sabio')).toEqual({ met: false, progressCurrent: 9, progressTarget: 10 })

    const ten = baseCtx({
      sessions: [
        ...Array.from({ length: 5 }, (_, i) => session({ id: i + 1, type: 'descanso_curto' })),
        ...Array.from({ length: 5 }, (_, i) => session({ id: i + 10, type: 'descanso_longo' })),
      ],
    })
    expect(findResult(ten, 'descanso_sabio')).toEqual({ met: true, progressCurrent: 10, progressTarget: 10 })
  })
})

describe('evaluateAchievements — composição com o ledger', () => {
  const now = new Date('2026-01-10T12:00:00Z')

  it('critério não atingido e ausente do ledger: unlockedAt nulo', () => {
    const ctx: AchievementContext = { sessions: [], tasks: [], level: 1, now }
    const result = evaluateAchievements(ctx, new Map())
    const primeiraSemente = result.find((a) => a.code === 'primeira_semente')
    expect(primeiraSemente?.unlockedAt).toBeNull()
  })

  it('critério atingido agora e ausente do ledger: unlockedAt = now (calculado "ao vivo")', () => {
    const ctx: AchievementContext = { sessions: [session({})], tasks: [], level: 1, now }
    const result = evaluateAchievements(ctx, new Map())
    const primeiraSemente = result.find((a) => a.code === 'primeira_semente')
    expect(primeiraSemente?.unlockedAt).toBe(now.toISOString())
  })

  it('critério já no ledger: mantém a data histórica congelada, mesmo recalculando "ao vivo"', () => {
    const frozenDate = '2025-06-15T08:00:00.000Z'
    const ctx: AchievementContext = { sessions: [session({})], tasks: [], level: 1, now }
    const ledger = new Map([['primeira_semente', frozenDate]])
    const result = evaluateAchievements(ctx, ledger)
    const primeiraSemente = result.find((a) => a.code === 'primeira_semente')
    expect(primeiraSemente?.unlockedAt).toBe(frozenDate)
  })

  it('retorna um Achievement para cada entrada do catálogo, com name/description do catálogo', () => {
    const ctx: AchievementContext = { sessions: [], tasks: [], level: 1, now }
    const result = evaluateAchievements(ctx, new Map())
    expect(result).toHaveLength(ACHIEVEMENT_CATALOG.length)
    expect(result[0]).toMatchObject({ code: 'primeira_semente', name: 'Primeira Semente' })
  })
})
