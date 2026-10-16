import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import i18n from '../i18n'
import { formatEventTimestamp, streakLabel } from './format'

const t = i18n.t.bind(i18n)

describe('streakLabel', () => {
  it('mostra convite a plantar quando não há streak', () => {
    expect(streakLabel(t, 0)).toBe('Plante o 1º foco de hoje')
  })

  it('usa singular para 1 dia de streak', () => {
    expect(streakLabel(t, 1)).toBe('1 dia seguido')
  })

  it('usa plural para mais de 1 dia de streak', () => {
    expect(streakLabel(t, 3)).toBe('3 dias seguidos')
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
    expect(formatEventTimestamp(t, new Date(2026, 9, 13, 14, 32).toISOString())).toBe('Hoje · 14:32')
  })

  it('mostra "Ontem" para um horário no dia anterior', () => {
    expect(formatEventTimestamp(t, new Date(2026, 9, 12, 9, 5).toISOString())).toBe('Ontem · 09:05')
  })

  it('mostra dd/MM para datas mais antigas', () => {
    expect(formatEventTimestamp(t, new Date(2026, 9, 1, 8, 0).toISOString())).toBe('01/10 · 08:00')
  })

  it('retorna string vazia para uma data inválida/ausente em vez de "NaN/NaN · NaN:NaN"', () => {
    expect(formatEventTimestamp(t, undefined as unknown as string)).toBe('')
    expect(formatEventTimestamp(t, '')).toBe('')
  })
})
