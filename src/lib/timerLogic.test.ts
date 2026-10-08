import { describe, expect, it } from 'vitest'
import type { PomodoroSession } from '../types/api'
import { computeCycleCount, formatMMSS, nextSuggestedType, SESSION_DURATIONS_SECONDS } from './timerLogic'

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
    expect(formatMMSS(SESSION_DURATIONS_SECONDS.foco)).toBe('25:00')
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
