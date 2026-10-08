import { afterEach, describe, expect, it } from 'vitest'
import { clearGuestProfile, createGuestProfile, loadGuestProfile, saveGuestProfile } from './guestProfile'

describe('guestProfile', () => {
  afterEach(() => {
    localStorage.clear()
  })

  it('loadGuestProfile sem nada salvo retorna null', () => {
    expect(loadGuestProfile()).toBeNull()
  })

  it('createGuestProfile só constrói o objeto — não persiste sozinho', () => {
    const profile = createGuestProfile('Visitante')

    expect(profile.name).toBe('Visitante')
    expect(profile.id).toEqual(expect.any(String))
    expect(loadGuestProfile()).toBeNull()
  })

  it('saveGuestProfile seguido de loadGuestProfile faz round-trip', () => {
    const profile = createGuestProfile('Visitante')

    saveGuestProfile(profile)

    expect(loadGuestProfile()).toEqual(profile)
  })

  it('loadGuestProfile com dado corrompido no localStorage retorna null', () => {
    localStorage.setItem('pomogarden:guest:v1', '{not valid json')

    expect(loadGuestProfile()).toBeNull()
  })

  it('loadGuestProfile com versão de envelope desconhecida retorna null', () => {
    localStorage.setItem('pomogarden:guest:v1', JSON.stringify({ version: 99, data: { id: 'x', name: 'x', createdAt: 'x' } }))

    expect(loadGuestProfile()).toBeNull()
  })

  it('clearGuestProfile remove o perfil salvo', () => {
    saveGuestProfile(createGuestProfile('Visitante'))

    clearGuestProfile()

    expect(loadGuestProfile()).toBeNull()
  })
})
