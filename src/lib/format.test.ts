import { describe, expect, it } from 'vitest'
import { pluralize, pluralizeCount, streakLabel } from './format'

describe('pluralize', () => {
  it('usa a forma singular quando count é 1', () => {
    expect(pluralize(1, 'colheita')).toBe('colheita')
  })

  it('usa o plural regular (singular + "s") quando count não é 1', () => {
    expect(pluralize(2, 'colheita')).toBe('colheitas')
  })

  it('trata 0 como plural', () => {
    expect(pluralize(0, 'colheita')).toBe('colheitas')
  })

  it('usa a forma plural explícita para plurais irregulares', () => {
    expect(pluralize(1, 'sessão', 'sessões')).toBe('sessão')
    expect(pluralize(3, 'sessão', 'sessões')).toBe('sessões')
  })
})

describe('pluralizeCount', () => {
  it('monta "<count> <singular>" quando count é 1', () => {
    expect(pluralizeCount(1, 'pomodoro')).toBe('1 pomodoro')
  })

  it('monta "<count> <plural>" quando count não é 1', () => {
    expect(pluralizeCount(5, 'pomodoro')).toBe('5 pomodoros')
  })

  it('aceita plural irregular explícito', () => {
    expect(pluralizeCount(2, 'item', 'itens')).toBe('2 itens')
  })
})

describe('streakLabel', () => {
  it('mostra convite a plantar quando não há streak', () => {
    expect(streakLabel(0)).toBe('Plante o 1º foco de hoje')
  })

  it('usa singular para 1 dia de streak', () => {
    expect(streakLabel(1)).toBe('1 dia seguido')
  })

  it('usa plural para mais de 1 dia de streak', () => {
    expect(streakLabel(3)).toBe('3 dias seguidos')
  })
})
