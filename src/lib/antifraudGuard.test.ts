import { describe, expect, it } from 'vitest'
import type { PomodoroSession } from '../types/api'
import { checkSessionIntegrity, isTimestampInFuture, overlapsAny } from './antifraudGuard'

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

describe('isTimestampInFuture', () => {
  const now = new Date('2026-01-01T12:00:00Z')

  it('timestamp no passado não é futuro', () => {
    expect(isTimestampInFuture('2026-01-01T11:00:00Z', now)).toBe(false)
  })

  it('timestamp exatamente agora não é futuro', () => {
    expect(isTimestampInFuture('2026-01-01T12:00:00Z', now)).toBe(false)
  })

  it('dentro da tolerância de 60s não é futuro', () => {
    expect(isTimestampInFuture('2026-01-01T12:01:00Z', now)).toBe(false) // exatamente +60s
    expect(isTimestampInFuture('2026-01-01T12:00:59Z', now)).toBe(false)
  })

  it('além da tolerância de 60s é futuro', () => {
    expect(isTimestampInFuture('2026-01-01T12:01:01Z', now)).toBe(true)
  })

  it('aceita uma tolerância customizada', () => {
    expect(isTimestampInFuture('2026-01-01T12:00:05Z', now, 2_000)).toBe(true)
    expect(isTimestampInFuture('2026-01-01T12:00:01Z', now, 2_000)).toBe(false)
  })
})

describe('overlapsAny', () => {
  const existing = [session({ startedAt: '2026-01-01T10:00:00Z', completedAt: '2026-01-01T10:25:00Z' })]

  it('intervalo totalmente fora não se sobrepõe', () => {
    const candidate = { startedAt: '2026-01-01T11:00:00Z', completedAt: '2026-01-01T11:25:00Z' }
    expect(overlapsAny(candidate, existing)).toBe(false)
  })

  it('intervalo que cruza o meio do existente se sobrepõe', () => {
    const candidate = { startedAt: '2026-01-01T10:10:00Z', completedAt: '2026-01-01T10:30:00Z' }
    expect(overlapsAny(candidate, existing)).toBe(true)
  })

  it('intervalo idêntico se sobrepõe', () => {
    const candidate = { startedAt: '2026-01-01T10:00:00Z', completedAt: '2026-01-01T10:25:00Z' }
    expect(overlapsAny(candidate, existing)).toBe(true)
  })

  it('intervalo que contém o existente inteiro se sobrepõe', () => {
    const candidate = { startedAt: '2026-01-01T09:00:00Z', completedAt: '2026-01-01T11:00:00Z' }
    expect(overlapsAny(candidate, existing)).toBe(true)
  })

  it('intervalos EXATAMENTE adjacentes (fim de um == início do outro) NÃO se sobrepõem', () => {
    // Candidato começa exatamente quando o existente termina.
    const startsRightAfter = { startedAt: '2026-01-01T10:25:00Z', completedAt: '2026-01-01T10:50:00Z' }
    expect(overlapsAny(startsRightAfter, existing)).toBe(false)

    // Candidato termina exatamente quando o existente começa.
    const endsRightBefore = { startedAt: '2026-01-01T09:35:00Z', completedAt: '2026-01-01T10:00:00Z' }
    expect(overlapsAny(endsRightBefore, existing)).toBe(false)
  })

  it('1ms de sobreposição já conta', () => {
    const candidate = { startedAt: '2026-01-01T10:24:59.999Z', completedAt: '2026-01-01T10:50:00Z' }
    expect(overlapsAny(candidate, existing)).toBe(true)
  })

  it('lista vazia nunca sobrepõe', () => {
    expect(overlapsAny({ startedAt: '2026-01-01T10:00:00Z', completedAt: '2026-01-01T10:25:00Z' }, [])).toBe(false)
  })
})

describe('checkSessionIntegrity', () => {
  const now = new Date('2026-01-01T12:00:00Z')
  const existing = [session({ startedAt: '2026-01-01T10:00:00Z', completedAt: '2026-01-01T10:25:00Z' })]

  it('sessão válida: null (sem violação)', () => {
    const candidate = { startedAt: '2026-01-01T11:00:00Z', completedAt: '2026-01-01T11:25:00Z' }
    expect(checkSessionIntegrity(candidate, existing, now)).toBeNull()
  })

  it('data no futuro tem precedência sobre sobreposição', () => {
    // Esse candidato está no futuro E se sobrepõe à sessão existente — deve reportar future_timestamp.
    const candidate = { startedAt: '2026-01-01T10:10:00Z', completedAt: '2026-01-02T00:00:00Z' }
    expect(checkSessionIntegrity(candidate, existing, now)).toBe('future_timestamp')
  })

  it('sobreposição sem estar no futuro reporta overlap', () => {
    const candidate = { startedAt: '2026-01-01T10:10:00Z', completedAt: '2026-01-01T10:30:00Z' }
    expect(checkSessionIntegrity(candidate, existing, now)).toBe('overlap')
  })

  it('intervalos adjacentes não disparam overlap dentro da checagem combinada', () => {
    const candidate = { startedAt: '2026-01-01T10:25:00Z', completedAt: '2026-01-01T10:50:00Z' }
    expect(checkSessionIntegrity(candidate, existing, now)).toBeNull()
  })
})
