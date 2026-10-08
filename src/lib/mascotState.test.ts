import { describe, expect, it } from 'vitest'
import { resolveMascotState } from './mascotState'

describe('resolveMascotState', () => {
  it('prioriza o resultado transitório (comemorando/acolhendo) sobre qualquer outro estado', () => {
    expect(
      resolveMascotState({ phase: 'rodando', type: 'foco', remainingSeconds: 1000, resultState: 'comemorando' }),
    ).toBe('comemorando')

    expect(
      resolveMascotState({ phase: 'pausado', type: 'foco', remainingSeconds: 10, resultState: 'acolhendo' }),
    ).toBe('acolhendo')
  })

  it('fica pausado quando a fase é pausado, mesmo sem resultado transitório', () => {
    expect(resolveMascotState({ phase: 'pausado', type: 'foco', remainingSeconds: 500, resultState: null })).toBe(
      'pausado',
    )
  })

  it('fica descansando durante uma pausa curta ou longa rodando', () => {
    expect(
      resolveMascotState({ phase: 'rodando', type: 'descanso_curto', remainingSeconds: 200, resultState: null }),
    ).toBe('descansando')
    expect(
      resolveMascotState({ phase: 'rodando', type: 'descanso_longo', remainingSeconds: 200, resultState: null }),
    ).toBe('descansando')
  })

  it('fica focado durante um foco rodando com 1 minuto ou mais restante', () => {
    expect(resolveMascotState({ phase: 'rodando', type: 'foco', remainingSeconds: 60, resultState: null })).toBe(
      'focado',
    )
  })

  it('fica "quase lá" durante um foco rodando com menos de 1 minuto restante', () => {
    expect(resolveMascotState({ phase: 'rodando', type: 'foco', remainingSeconds: 59, resultState: null })).toBe(
      'quase_la',
    )
  })

  it('fica ocioso quando parado e sem resultado transitório', () => {
    expect(resolveMascotState({ phase: 'parado', type: 'foco', remainingSeconds: 1500, resultState: null })).toBe(
      'ocioso',
    )
  })
})
