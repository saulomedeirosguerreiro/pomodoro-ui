import { describe, expect, it } from 'vitest'
import i18n from '../i18n'
import { mascotLabel, mascotPhrases, pickPhrase } from './mascotPhrases'
import type { MascotState } from './mascotState'

const t = i18n.t.bind(i18n)
const ALL_STATES: MascotState[] = ['ocioso', 'focado', 'quase_la', 'descansando', 'pausado', 'comemorando', 'acolhendo']

describe('mascotPhrases', () => {
  it('tem pelo menos 3 falas para cada estado (US-39 RN-01)', () => {
    for (const state of ALL_STATES) {
      expect(mascotPhrases(t, state).length).toBeGreaterThanOrEqual(3)
    }
  })
})

describe('mascotLabel', () => {
  it('tem um rótulo textual para cada estado', () => {
    for (const state of ALL_STATES) {
      expect(mascotLabel(t, state)).toMatch(/^Tomatinho:/)
    }
  })
})

describe('pickPhrase', () => {
  it('nunca repete a fala anterior quando há mais de uma opção', () => {
    for (let i = 0; i < 50; i++) {
      const phrase = pickPhrase(t, 'ocioso', mascotPhrases(t, 'ocioso')[0])
      expect(phrase).not.toBe(mascotPhrases(t, 'ocioso')[0])
    }
  })

  it('retorna sempre uma fala do catálogo do estado', () => {
    const phrase = pickPhrase(t, 'focado', null)
    expect(mascotPhrases(t, 'focado')).toContain(phrase)
  })
})
