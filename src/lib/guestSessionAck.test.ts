import { afterEach, describe, expect, it, vi } from 'vitest'
import { ackGuestSession, hasAckedGuestSession } from './guestSessionAck'

describe('guestSessionAck', () => {
  afterEach(() => {
    sessionStorage.clear()
    vi.restoreAllMocks()
  })

  it('sem flag salva, hasAckedGuestSession retorna false', () => {
    expect(hasAckedGuestSession()).toBe(false)
  })

  it('depois de ackGuestSession, hasAckedGuestSession retorna true', () => {
    ackGuestSession()

    expect(hasAckedGuestSession()).toBe(true)
  })

  it('com sessionStorage indisponível, hasAckedGuestSession retorna true (não trava num modal que nunca resolve)', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('sessionStorage indisponível')
    })

    expect(hasAckedGuestSession()).toBe(true)
  })

  it('com sessionStorage indisponível, ackGuestSession não lança erro', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('sessionStorage indisponível')
    })

    expect(() => ackGuestSession()).not.toThrow()
  })
})
