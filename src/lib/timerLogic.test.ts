import { describe, expect, it } from 'vitest'
import type { PomodoroSession } from '../types/api'
import {
  computeCycleCount,
  computeRemainingSeconds,
  DEFAULT_SESSION_DURATIONS_SECONDS,
  flexibleBreakSessionType,
  formatMMSS,
  nextSuggestedType,
  sessionDurationsSecondsFrom,
} from './timerLogic'

describe('sessionDurationsSecondsFrom', () => {
  it('converte minutos em segundos por tipo', () => {
    expect(sessionDurationsSecondsFrom(40, 10, 20)).toEqual({
      foco: 2400,
      descanso_curto: 600,
      descanso_longo: 1200,
    })
  })

  it('com os valores de fábrica em minutos, reproduz DEFAULT_SESSION_DURATIONS_SECONDS', () => {
    expect(sessionDurationsSecondsFrom(25, 5, 15)).toEqual(DEFAULT_SESSION_DURATIONS_SECONDS)
  })
})

describe('nextSuggestedType', () => {
  it.each([
    [1, 'descanso_curto'],
    [2, 'descanso_curto'],
    [3, 'descanso_curto'],
    [4, 'descanso_longo'],
    [8, 'descanso_longo'],
  ] as const)('após foco com %i concluídos no total, sugere %s', (total, expected) => {
    expect(nextSuggestedType('foco', total)).toBe(expected)
  })

  it.each(['descanso_curto', 'descanso_longo'] as const)('após %s, sugere foco', (type) => {
    expect(nextSuggestedType(type, 0)).toBe('foco')
  })
})

describe('formatMMSS', () => {
  it('formata minutos e segundos com dois dígitos', () => {
    expect(formatMMSS(DEFAULT_SESSION_DURATIONS_SECONDS.foco)).toBe('25:00')
    expect(formatMMSS(65)).toBe('01:05')
    expect(formatMMSS(5)).toBe('00:05')
  })

  it('nunca retorna negativo', () => {
    expect(formatMMSS(-10)).toBe('00:00')
  })
})

describe('computeCycleCount', () => {
  const session = (overrides: Partial<PomodoroSession>): PomodoroSession => ({
    id: 1,
    type: 'foco',
    status: 'concluido',
    durationSeconds: 1500,
    startedAt: '2026-01-01T10:00:00Z',
    completedAt: '2026-01-01T10:25:00Z',
    createdAt: '2026-01-01T10:25:00Z',
    ...overrides,
  })

  it('sem sessões, conta 0', () => {
    expect(computeCycleCount([])).toBe(0)
  })

  it('conta focos concluídos, mais recente primeiro', () => {
    const sessions = [
      session({ id: 3 }),
      session({ id: 2, type: 'descanso_curto' }),
      session({ id: 1 }),
    ]

    expect(computeCycleCount(sessions)).toBe(2)
  })

  it('para de contar ao achar uma pausa longa concluída', () => {
    const sessions = [
      session({ id: 4 }),
      session({ id: 3, type: 'descanso_longo' }),
      session({ id: 2 }),
      session({ id: 1 }),
    ]

    expect(computeCycleCount(sessions)).toBe(1)
  })

  it('foco interrompido não conta, mas não quebra a contagem', () => {
    const sessions = [
      session({ id: 2 }),
      session({ id: 1, status: 'interrompido' }),
    ]

    expect(computeCycleCount(sessions)).toBe(1)
  })

  it('pausa longa interrompida não reseta o ciclo', () => {
    const sessions = [
      session({ id: 2 }),
      session({ id: 1, type: 'descanso_longo', status: 'interrompido' }),
    ]

    expect(computeCycleCount(sessions)).toBe(1)
  })
})

describe('computeRemainingSeconds', () => {
  it('sem tempo decorrido, retorna o total cheio', () => {
    expect(computeRemainingSeconds(1500, 1000, 0, 1000)).toBe(1500)
  })

  it('desconta o tempo decorrido desde o início', () => {
    expect(computeRemainingSeconds(1500, 1000, 0, 1000 + 5000)).toBe(1495)
  })

  it('desconta o tempo pausado acumulado do decorrido', () => {
    expect(computeRemainingSeconds(1500, 1000, 3000, 1000 + 5000)).toBe(1498)
  })

  it('nunca retorna negativo mesmo além do total', () => {
    expect(computeRemainingSeconds(10, 1000, 0, 1000 + 20_000)).toBe(0)
  })
})

describe('flexibleBreakSessionType', () => {
  it.each([1, 5, 15, 30])('%i minutos é descanso_curto (fronteira máxima em 30)', (minutes) => {
    expect(flexibleBreakSessionType(minutes)).toBe('descanso_curto')
  })

  it.each([31, 45, 60])('%i minutos é descanso_longo (a partir de 31)', (minutes) => {
    expect(flexibleBreakSessionType(minutes)).toBe('descanso_longo')
  })
})
