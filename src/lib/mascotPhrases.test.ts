import { describe, expect, it } from 'vitest'
import { MASCOT_LABELS, MASCOT_PHRASES, pickPhrase } from './mascotPhrases'
import type { MascotState } from './mascotState'

const ALL_STATES: MascotState[] = ['ocioso', 'focado', 'quase_la', 'descansando', 'pausado', 'comemorando', 'acolhendo']

describe('MASCOT_PHRASES', () => {
  it('tem pelo menos 3 falas para cada estado (US-39 RN-01)', () => {
    for (const state of ALL_STATES) {
      expect(MASCOT_PHRASES[state].length).toBeGreaterThanOrEqual(3)
    }
  })
})

describe('MASCOT_LABELS', () => {
  it('tem um rótulo textual para cada estado', () => {
    for (const state of ALL_STATES) {
      expect(MASCOT_LABELS[state]).toMatch(/^Tomatinho:/)
    }
  })
})

describe('pickPhrase', () => {
  it('nunca repete a fala anterior quando há mais de uma opção', () => {
    for (let i = 0; i < 50; i++) {
      const phrase = pickPhrase('ocioso', MASCOT_PHRASES.ocioso[0])
      expect(phrase).not.toBe(MASCOT_PHRASES.ocioso[0])
    }
  })

  it('retorna sempre uma fala do catálogo do estado', () => {
    const phrase = pickPhrase('focado', null)
    expect(MASCOT_PHRASES.focado).toContain(phrase)
  })
})
