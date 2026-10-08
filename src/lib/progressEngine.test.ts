import { describe, expect, it } from 'vitest'
import type { PomodoroSession } from '../types/api'
import {
  buildProgressSummary,
  computeLevelInfo,
  computeLocalStreak,
  computeSessionReward,
  computeTitleForLevel,
  computeTodaySummary,
  computeTotals,
} from './progressEngine'

const TIME_ZONE = 'America/Sao_Paulo'

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

describe('computeSessionReward', () => {
  it('foco concluído dá 25xp/15 sementes', () => {
    expect(computeSessionReward('foco', 'concluido')).toEqual({ xp: 25, seeds: 15 })
  })

  it('descanso_curto concluído dá 5xp/0 sementes', () => {
    expect(computeSessionReward('descanso_curto', 'concluido')).toEqual({ xp: 5, seeds: 0 })
  })

  it('descanso_longo concluído dá 5xp/10 sementes', () => {
    expect(computeSessionReward('descanso_longo', 'concluido')).toEqual({ xp: 5, seeds: 10 })
  })

  it.each(['foco', 'descanso_curto', 'descanso_longo'] as const)(
    '%s interrompido não dá nada',
    (type) => {
      expect(computeSessionReward(type, 'interrompido')).toEqual({ xp: 0, seeds: 0 })
    },
  )
})

describe('computeTotals', () => {
  it('soma xp e sementes de várias sessões', () => {
    const sessions = [
      session({ id: 1, type: 'foco' }),
      session({ id: 2, type: 'descanso_longo' }),
      session({ id: 3, type: 'foco', status: 'interrompido' }),
    ]
    expect(computeTotals(sessions)).toEqual({ totalXp: 30, seeds: 25 })
  })

  it('sem sessões, soma zero', () => {
    expect(computeTotals([])).toEqual({ totalXp: 0, seeds: 0 })
  })
})

describe('computeLevelInfo', () => {
  it('0 xp é nível 1, 0 xp no nível, 200 para o próximo', () => {
    expect(computeLevelInfo(0)).toEqual({ level: 1, xpInLevel: 0, xpForNextLevel: 200 })
  })

  it('199 xp ainda é nível 1 (não fechou a faixa)', () => {
    expect(computeLevelInfo(199)).toEqual({ level: 1, xpInLevel: 199, xpForNextLevel: 200 })
  })

  it('exatamente 200 xp sobe para nível 2 com 0 no nível', () => {
    expect(computeLevelInfo(200)).toEqual({ level: 2, xpInLevel: 0, xpForNextLevel: 400 })
  })

  it('200 + 399 = 599 xp ainda é nível 2 (nível 2->3 custa 400)', () => {
    expect(computeLevelInfo(599)).toEqual({ level: 2, xpInLevel: 399, xpForNextLevel: 400 })
  })

  it('200 + 400 = 600 xp sobe para nível 3', () => {
    expect(computeLevelInfo(600)).toEqual({ level: 3, xpInLevel: 0, xpForNextLevel: 600 })
  })
})

describe('computeTitleForLevel', () => {
  it.each([
    [1, 'Semente Curiosa'],
    [2, 'Broto Aprendiz'],
    [3, 'Jardineiro Produtivo'],
    [4, 'Jardineiro Produtivo'],
    [5, 'Horticultor Focado'],
    [7, 'Horticultor Focado'],
    [8, 'Mestre da Horta'],
    [11, 'Mestre da Horta'],
    [12, 'Guardião do Pomar'],
    [100, 'Guardião do Pomar'],
  ] as const)('nível %i => %s', (level, expected) => {
    expect(computeTitleForLevel(level)).toBe(expected)
  })
})

describe('computeLocalStreak', () => {
  it('sem sessões: streak 0 e em risco hoje', () => {
    const now = new Date('2026-01-10T12:00:00Z')
    expect(computeLocalStreak([], TIME_ZONE, now)).toEqual({ streakDays: 0, isStreakAtRiskToday: true })
  })

  it('foco concluído hoje: streak 1 e NÃO em risco', () => {
    const now = new Date('2026-01-10T15:00:00Z') // 12h local (UTC-3)
    const sessions = [session({ completedAt: '2026-01-10T14:00:00Z' })] // 11h local, mesmo dia
    expect(computeLocalStreak(sessions, TIME_ZONE, now)).toEqual({ streakDays: 1, isStreakAtRiskToday: false })
  })

  it('streak vivo só por causa de ontem: hoje ainda não tem foco, mas conta via ontem — e fica em risco', () => {
    const now = new Date('2026-01-10T12:00:00Z') // 09h local
    const sessions = [session({ completedAt: '2026-01-09T14:00:00Z' })] // ontem, 11h local
    expect(computeLocalStreak(sessions, TIME_ZONE, now)).toEqual({ streakDays: 1, isStreakAtRiskToday: true })
  })

  it('gap de 2+ dias sem foco: streak zera mesmo havendo histórico', () => {
    const now = new Date('2026-01-10T12:00:00Z')
    const sessions = [session({ completedAt: '2026-01-07T14:00:00Z' })] // 3 dias atrás
    expect(computeLocalStreak(sessions, TIME_ZONE, now)).toEqual({ streakDays: 0, isStreakAtRiskToday: true })
  })

  it('3 dias consecutivos (hoje, ontem, anteontem) contam streak 3', () => {
    const now = new Date('2026-01-10T15:00:00Z') // 12h local
    const sessions = [
      session({ id: 1, completedAt: '2026-01-10T14:00:00Z' }), // hoje 11h local
      session({ id: 2, completedAt: '2026-01-09T14:00:00Z' }), // ontem 11h local
      session({ id: 3, completedAt: '2026-01-08T14:00:00Z' }), // anteontem 11h local
    ]
    expect(computeLocalStreak(sessions, TIME_ZONE, now)).toEqual({ streakDays: 3, isStreakAtRiskToday: false })
  })

  it('sessão que cruza meia-noite local: a data de referência é a de completedAt, não a de startedAt', () => {
    const now = new Date('2026-01-10T15:00:00Z') // 12h local, hoje = 2026-01-10
    // startedAt 02:50Z = 2026-01-09 23:50 local (dia 9); completedAt 03:10Z = 2026-01-10 00:10 local (dia 10).
    // A sessão começou no dia local 9, mas terminou (e deve ser contabilizada) no dia local 10.
    const sessions = [session({ startedAt: '2026-01-10T02:50:00Z', completedAt: '2026-01-10T03:10:00Z' })]
    expect(computeLocalStreak(sessions, TIME_ZONE, now)).toEqual({ streakDays: 1, isStreakAtRiskToday: false })
  })

  it('foco interrompido não conta para o streak', () => {
    const now = new Date('2026-01-10T15:00:00Z')
    const sessions = [session({ completedAt: '2026-01-10T14:00:00Z', status: 'interrompido' })]
    expect(computeLocalStreak(sessions, TIME_ZONE, now)).toEqual({ streakDays: 0, isStreakAtRiskToday: true })
  })
})

describe('computeTodaySummary', () => {
  it('conta e soma duração só dos focos concluídos de hoje (data local)', () => {
    const now = new Date('2026-01-10T15:00:00Z') // 12h local
    const sessions = [
      session({ id: 1, completedAt: '2026-01-10T14:00:00Z', durationSeconds: 1500 }), // hoje local
      session({ id: 2, completedAt: '2026-01-09T14:00:00Z', durationSeconds: 1500 }), // ontem local
      session({ id: 3, completedAt: '2026-01-10T13:00:00Z', durationSeconds: 300, type: 'descanso_curto' }),
    ]
    expect(computeTodaySummary(sessions, TIME_ZONE, now)).toEqual({ todayFocusCount: 1, todayFocusSeconds: 1500 })
  })

  it('sem focos hoje: zero/zero', () => {
    const now = new Date('2026-01-10T15:00:00Z')
    expect(computeTodaySummary([], TIME_ZONE, now)).toEqual({ todayFocusCount: 0, todayFocusSeconds: 0 })
  })
})

describe('buildProgressSummary', () => {
  it('compõe xp/nível/título/streak/resumo do dia num único objeto no formato ProgressSummary', () => {
    const now = new Date('2026-01-10T15:00:00Z')
    const sessions = [session({ completedAt: '2026-01-10T14:00:00Z' })]
    const summary = buildProgressSummary(sessions, TIME_ZONE, now)

    expect(summary).toEqual({
      level: 1,
      title: 'Semente Curiosa',
      xpInLevel: 25,
      xpForNextLevel: 200,
      totalXp: 25,
      seeds: 15,
      streakDays: 1,
      isStreakAtRiskToday: false,
      todayFocusCount: 1,
      todayFocusSeconds: 1500,
    })
  })
})
