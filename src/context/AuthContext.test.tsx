import { act, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { UNAUTHORIZED_EVENT } from '../lib/apiClient'
import { trackEvent } from '../lib/analytics'
import { authService } from '../lib/authService'
import { tokenStorage } from '../lib/tokenStorage'
import { usersService } from '../lib/usersService'
import { AuthProvider, useAuth } from './AuthContext'

vi.mock('../lib/usersService', () => ({
  usersService: { getMe: vi.fn() },
}))

vi.mock('../lib/authService', () => ({
  authService: { login: vi.fn() },
}))

vi.mock('../lib/analytics', () => ({
  trackEvent: vi.fn(),
}))

/** Consumidor mínimo só para expor `user`/`sessionExpired` no DOM e disparar `acknowledgeSessionExpired`. */
function Probe() {
  const { user, sessionExpired, login, acknowledgeSessionExpired } = useAuth()
  return (
    <div>
      <p>user: {user ? user.name : 'nenhum'}</p>
      <p>sessionExpired: {String(sessionExpired)}</p>
      <button onClick={() => login('joao@email.com', 'Senha123')}>Entrar</button>
      <button onClick={acknowledgeSessionExpired}>Reconhecer</button>
    </div>
  )
}

function renderProbe() {
  return render(
    <AuthProvider>
      <Probe />
    </AuthProvider>,
  )
}

describe('AuthContext', () => {
  afterEach(() => {
    vi.restoreAllMocks()
    localStorage.clear()
  })

  it('401 (UNAUTHORIZED_EVENT) desloga e marca sessionExpired (US-82)', async () => {
    renderProbe()
    expect(await screen.findByText('sessionExpired: false')).toBeInTheDocument()

    act(() => {
      window.dispatchEvent(new Event(UNAUTHORIZED_EVENT))
    })

    expect(await screen.findByText('user: nenhum')).toBeInTheDocument()
    expect(screen.getByText('sessionExpired: true')).toBeInTheDocument()
  })

  it('acknowledgeSessionExpired limpa a flag', async () => {
    renderProbe()

    act(() => {
      window.dispatchEvent(new Event(UNAUTHORIZED_EVENT))
    })
    expect(await screen.findByText('sessionExpired: true')).toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: 'Reconhecer' }))

    expect(await screen.findByText('sessionExpired: false')).toBeInTheDocument()
  })

  it('login bem-sucedido popula o user e não mexe em sessionExpired', async () => {
    vi.mocked(authService.login).mockResolvedValue({
      token: 'tok-123',
      user: { id: 1, name: 'João', email: 'joao@email.com' },
    })
    vi.mocked(usersService.getMe).mockResolvedValue({
      id: 1,
      name: 'João',
      email: 'joao@email.com',
      completedSessions: 0,
    })

    renderProbe()
    await userEvent.click(screen.getByRole('button', { name: 'Entrar' }))

    expect(await screen.findByText('user: João')).toBeInTheDocument()
    expect(screen.getByText('sessionExpired: false')).toBeInTheDocument()
    expect(tokenStorage.get()).toBe('tok-123')
    expect(trackEvent).toHaveBeenCalledWith('login')
  })
})
