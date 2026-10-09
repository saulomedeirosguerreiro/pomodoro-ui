import { afterEach, describe, expect, it } from 'vitest'
import { DEFAULT_SETTINGS, loadSettings, saveSettings } from './settings'

describe('settings', () => {
  afterEach(() => {
    localStorage.clear()
  })

  it('loadSettings sem nada salvo retorna os defaults', () => {
    expect(loadSettings()).toEqual(DEFAULT_SETTINGS)
  })

  it('saveSettings seguido de loadSettings faz round-trip', () => {
    const custom = { ...DEFAULT_SETTINGS, notificationsEnabled: true, lofiVolume: 0.3 }

    saveSettings(custom)

    expect(loadSettings()).toEqual(custom)
  })

  it('loadSettings com dado corrompido no localStorage volta para os defaults', () => {
    localStorage.setItem('pomogarden:settings', '{not valid json')

    expect(loadSettings()).toEqual(DEFAULT_SETTINGS)
  })

  it('loadSettings preenche campos ausentes com o default (migração de versão antiga)', () => {
    localStorage.setItem('pomogarden:settings', JSON.stringify({ notificationsEnabled: true }))

    expect(loadSettings()).toEqual({ ...DEFAULT_SETTINGS, notificationsEnabled: true })
  })

  it('durações de sessão têm 25/5/15 minutos como padrão de fábrica', () => {
    expect(DEFAULT_SETTINGS.focusMinutes).toBe(25)
    expect(DEFAULT_SETTINGS.shortBreakMinutes).toBe(5)
    expect(DEFAULT_SETTINGS.longBreakMinutes).toBe(15)
  })

  it('loadSettings preenche as durações ausentes com o default (migração de versão antiga sem os 3 campos novos)', () => {
    localStorage.setItem('pomogarden:settings', JSON.stringify({ focusMinutes: 40 }))

    expect(loadSettings()).toEqual({ ...DEFAULT_SETTINGS, focusMinutes: 40 })
  })
})
