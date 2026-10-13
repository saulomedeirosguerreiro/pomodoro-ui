import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { formatEventTimestamp, pluralize, pluralizeCount, streakLabel } from './format'

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

describe('formatEventTimestamp', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2026, 9, 13, 18, 0))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('mostra "Hoje" para um horário no mesmo dia', () => {
    expect(formatEventTimestamp(new Date(2026, 9, 13, 14, 32).toISOString())).toBe('Hoje · 14:32')
  })

  it('mostra "Ontem" para um horário no dia anterior', () => {
    expect(formatEventTimestamp(new Date(2026, 9, 12, 9, 5).toISOString())).toBe('Ontem · 09:05')
  })

  it('mostra dd/MM para datas mais antigas', () => {
    expect(formatEventTimestamp(new Date(2026, 9, 1, 8, 0).toISOString())).toBe('01/10 · 08:00')
  })

  it('retorna string vazia para uma data inválida/ausente em vez de "NaN/NaN · NaN:NaN"', () => {
    expect(formatEventTimestamp(undefined as unknown as string)).toBe('')
    expect(formatEventTimestamp('')).toBe('')
  })
})
