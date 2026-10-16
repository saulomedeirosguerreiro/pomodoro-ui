import { describe, expect, it } from 'vitest'
import type { SessionRegistration } from '../components/Timer/useTimer'
import i18n from '../i18n'
import { ApiError } from '../types/api'
import { describeRegistrationError } from './useSessionRegistration'

const t = i18n.t.bind(i18n)

function buildRegistration(overrides: Partial<SessionRegistration> = {}): SessionRegistration {
  return {
    type: 'foco',
    status: 'interrompido',
    durationSeconds: 10,
    startedAt: '2026-10-14T10:00:00Z',
    completedAt: '2026-10-14T10:00:10Z',
    ...overrides,
  }
}

describe('describeRegistrationError', () => {
  it('backend remoto (validation_error + campo DurationSeconds), duração abaixo do mínimo: mensagem amigável, não reenviável', () => {
    const error = new ApiError(422, {
      code: 'validation_error',
      message: 'Duração inválida.',
      fields: [{ field: 'DurationSeconds', message: 'fora da faixa' }],
    })

    const result = describeRegistrationError(t, error, buildRegistration({ durationSeconds: 10 }))

    expect(result.retryable).toBe(false)
    expect(result.message).toContain('durou menos que o mínimo')
  })

  it('backend remoto, duração acima do máximo: mensagem amigável, não reenviável', () => {
    const error = new ApiError(422, {
      code: 'validation_error',
      message: 'Duração inválida.',
      fields: [{ field: 'DurationSeconds', message: 'fora da faixa' }],
    })

    const result = describeRegistrationError(t, error, buildRegistration({ durationSeconds: 999 * 60 }))

    expect(result.retryable).toBe(false)
    expect(result.message).toContain('passou do máximo')
  })

  // Bug corrigido: localDataSource.ts (modo guest) manda um código de erro diferente do backend
  // remoto para o MESMO caso — sem reconhecer os dois, o modo guest sempre caía no texto genérico
  // "tente novamente", que não ajuda aqui porque reenviar falha de novo com a mesma duração.
  it('modo guest (localDataSource, código invalid_duration), duração abaixo do mínimo: mesma mensagem amigável, não reenviável', () => {
    const error = new ApiError(422, {
      code: 'invalid_duration',
      message: 'A duração informada está fora da tolerância permitida para este tipo de sessão.',
    })

    const result = describeRegistrationError(t, error, buildRegistration({ type: 'foco', durationSeconds: 3 }))

    expect(result.retryable).toBe(false)
    expect(result.message).toContain('durou menos que o mínimo')
  })

  it('modo guest, duração acima do máximo: mesma mensagem amigável, não reenviável', () => {
    const error = new ApiError(422, {
      code: 'invalid_duration',
      message: 'A duração informada está fora da tolerância permitida para este tipo de sessão.',
    })

    const result = describeRegistrationError(t, error, buildRegistration({ type: 'descanso_curto', durationSeconds: 40 * 60 }))

    expect(result.retryable).toBe(false)
    expect(result.message).toContain('passou do máximo')
  })

  it('ApiError de outro tipo (ex.: overlap) cai no texto genérico, reenviável', () => {
    const error = new ApiError(409, { code: 'overlap', message: 'Sobreposição.' })

    const result = describeRegistrationError(t, error, buildRegistration())

    expect(result.retryable).toBe(true)
    expect(result.message).toBe('Não foi possível registrar a sessão. Seus dados não foram perdidos.')
  })

  it('validation_error sem o campo DurationSeconds cai no texto genérico, reenviável', () => {
    const error = new ApiError(422, {
      code: 'validation_error',
      message: 'Dados inválidos.',
      fields: [{ field: 'TaskId', message: 'inválido' }],
    })

    const result = describeRegistrationError(t, error, buildRegistration())

    expect(result.retryable).toBe(true)
    expect(result.message).toBe('Não foi possível registrar a sessão. Seus dados não foram perdidos.')
  })

  it('erro que não é ApiError (ex.: falha de rede) cai no texto genérico, reenviável', () => {
    const result = describeRegistrationError(t, new TypeError('Failed to fetch'), buildRegistration())

    expect(result.retryable).toBe(true)
    expect(result.message).toBe('Não foi possível registrar a sessão. Seus dados não foram perdidos.')
  })
})
