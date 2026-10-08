import { describe, expect, it } from 'vitest'
import type { TaskItem } from '../types/api'
import type { TaskPayload } from './tasksService'
import {
  canLinkTaskToSession,
  isCompletedAtValid,
  isDurationWithinTolerance,
  validateTaskPayload,
} from './entityValidation'

function payload(overrides: Partial<TaskPayload>): TaskPayload {
  return {
    title: 'Título válido',
    description: null,
    priority: 'media',
    estimatedPomodoros: 1,
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

describe('validateTaskPayload — título', () => {
  it('título vazio é inválido', () => {
    expect(validateTaskPayload(payload({ title: '' }))).toEqual([
      { field: 'title', message: 'Título deve ter entre 1 e 120 caracteres.' },
    ])
  })

  it('título só com espaços é inválido (trim antes de contar)', () => {
    expect(validateTaskPayload(payload({ title: '   ' }))).toEqual([
      { field: 'title', message: 'Título deve ter entre 1 e 120 caracteres.' },
    ])
  })

  it('título com 1 caractere é válido (fronteira mínima)', () => {
    expect(validateTaskPayload(payload({ title: 'A' }))).toEqual([])
  })

  it('título com exatamente 120 caracteres (trimado) é válido (fronteira máxima)', () => {
    expect(validateTaskPayload(payload({ title: 'A'.repeat(120) }))).toEqual([])
  })

  it('título com 121 caracteres é inválido', () => {
    expect(validateTaskPayload(payload({ title: 'A'.repeat(121) }))).toEqual([
      { field: 'title', message: 'Título deve ter entre 1 e 120 caracteres.' },
    ])
  })

  it('espaços nas pontas não contam para o limite (120 reais + espaços ainda é válido)', () => {
    expect(validateTaskPayload(payload({ title: `  ${'A'.repeat(120)}  ` }))).toEqual([])
  })
})

describe('validateTaskPayload — descrição', () => {
  it('descrição nula é válida', () => {
    expect(validateTaskPayload(payload({ description: null }))).toEqual([])
  })

  it('descrição com exatamente 500 caracteres é válida (fronteira máxima)', () => {
    expect(validateTaskPayload(payload({ description: 'B'.repeat(500) }))).toEqual([])
  })

  it('descrição com 501 caracteres é inválida', () => {
    expect(validateTaskPayload(payload({ description: 'B'.repeat(501) }))).toEqual([
      { field: 'description', message: 'Descrição deve ter no máximo 500 caracteres.' },
    ])
  })

  it('descrição NÃO é trimada antes de contar (diferente do título, replica o domínio C#)', () => {
    const paddedTo501 = ` ${'B'.repeat(500)}` // 501 caracteres brutos, mas 500 reais após trim
    expect(validateTaskPayload(payload({ description: paddedTo501 }))).toEqual([
      { field: 'description', message: 'Descrição deve ter no máximo 500 caracteres.' },
    ])
  })
})

describe('validateTaskPayload — estimativa de pomodoros', () => {
  it('0 é inválido (abaixo do mínimo)', () => {
    expect(validateTaskPayload(payload({ estimatedPomodoros: 0 }))).toEqual([
      { field: 'estimatedPomodoros', message: 'Estimativa de pomodoros deve ser entre 1 e 20.' },
    ])
  })

  it('1 é válido (fronteira mínima)', () => {
    expect(validateTaskPayload(payload({ estimatedPomodoros: 1 }))).toEqual([])
  })

  it('20 é válido (fronteira máxima)', () => {
    expect(validateTaskPayload(payload({ estimatedPomodoros: 20 }))).toEqual([])
  })

  it('21 é inválido (acima do máximo)', () => {
    expect(validateTaskPayload(payload({ estimatedPomodoros: 21 }))).toEqual([
      { field: 'estimatedPomodoros', message: 'Estimativa de pomodoros deve ser entre 1 e 20.' },
    ])
  })
})

describe('validateTaskPayload — múltiplos erros', () => {
  it('acumula um FieldError por campo inválido', () => {
    const errors = validateTaskPayload(payload({ title: '', description: 'B'.repeat(501), estimatedPomodoros: 0 }))
    expect(errors.map((e) => e.field)).toEqual(['title', 'description', 'estimatedPomodoros'])
  })
})

describe('isDurationWithinTolerance', () => {
  it('duração padrão exata é válida', () => {
    expect(isDurationWithinTolerance('foco', 25 * 60)).toBe(true)
  })

  it('duração padrão + 60s (fronteira máxima) é válida', () => {
    expect(isDurationWithinTolerance('foco', 25 * 60 + 60)).toBe(true)
  })

  it('duração padrão + 61s é inválida (passou da tolerância)', () => {
    expect(isDurationWithinTolerance('foco', 25 * 60 + 61)).toBe(false)
  })

  it('não há tolerância para baixo do padrão — só o piso é duração > 0', () => {
    expect(isDurationWithinTolerance('foco', 1)).toBe(true)
    expect(isDurationWithinTolerance('foco', 0)).toBe(false)
    expect(isDurationWithinTolerance('foco', -1)).toBe(false)
  })

  it('cada tipo de sessão usa seu próprio padrão', () => {
    expect(isDurationWithinTolerance('descanso_curto', 5 * 60 + 60)).toBe(true)
    expect(isDurationWithinTolerance('descanso_curto', 5 * 60 + 61)).toBe(false)
    expect(isDurationWithinTolerance('descanso_longo', 15 * 60 + 60)).toBe(true)
    expect(isDurationWithinTolerance('descanso_longo', 15 * 60 + 61)).toBe(false)
  })
})

describe('isCompletedAtValid', () => {
  it('completedAt depois de startedAt é válido', () => {
    expect(isCompletedAtValid('2026-01-01T10:00:00Z', '2026-01-01T10:25:00Z')).toBe(true)
  })

  it('completedAt igual a startedAt é válido (>=, não >)', () => {
    expect(isCompletedAtValid('2026-01-01T10:00:00Z', '2026-01-01T10:00:00Z')).toBe(true)
  })

  it('completedAt antes de startedAt é inválido', () => {
    expect(isCompletedAtValid('2026-01-01T10:00:00Z', '2026-01-01T09:59:59Z')).toBe(false)
  })
})

describe('canLinkTaskToSession', () => {
  it('sem tarefa (null), nunca pode vincular', () => {
    expect(canLinkTaskToSession(null, 'foco')).toBe(false)
  })

  it('sessão que não é foco, nunca pode vincular', () => {
    expect(canLinkTaskToSession(task({ status: 'a_fazer' }), 'descanso_curto')).toBe(false)
    expect(canLinkTaskToSession(task({ status: 'a_fazer' }), 'descanso_longo')).toBe(false)
  })

  it('tarefa já feita não pode receber novo vínculo', () => {
    expect(canLinkTaskToSession(task({ status: 'feito' }), 'foco')).toBe(false)
  })

  it('tarefa a_fazer ou em_curso com sessão de foco pode vincular', () => {
    expect(canLinkTaskToSession(task({ status: 'a_fazer' }), 'foco')).toBe(true)
    expect(canLinkTaskToSession(task({ status: 'em_curso' }), 'foco')).toBe(true)
  })
})
