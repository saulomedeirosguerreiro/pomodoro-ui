import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import * as AuthContext from '../../context/AuthContext'
import * as GuestContext from '../../context/GuestContext'
import { WelcomeOnlyRoute } from './WelcomeOnlyRoute'

function renderWelcomeOnly() {
  return render(
    <MemoryRouter initialEntries={['/boas-vindas']}>
      <Routes>
        <Route path="/timer" element={<p>Tela do timer</p>} />
        <Route element={<WelcomeOnlyRoute />}>
          <Route path="/boas-vindas" element={<p>Tela de boas-vindas</p>} />
        </Route>
      </Routes>
    </MemoryRouter>,
  )
}

function mockAuth(user: { id: number; name: string; email: string; completedSessions: number } | null) {
  vi.spyOn(AuthContext, 'useAuth').mockReturnValue({
    user,
    isLoading: false,
    sessionExpired: false,
    login: vi.fn(),
    logout: vi.fn(),
    refreshProfile: vi.fn(),
    acknowledgeSessionExpired: vi.fn(),
  })
}

function mockGuest(guest: { id: string; name: string; createdAt: string } | null) {
  vi.spyOn(GuestContext, 'useGuest').mockReturnValue({
    guest,
    isLoading: false,
    startGuest: vi.fn(),
    clearGuestData: vi.fn(),
  })
}

describe('WelcomeOnlyRoute', () => {
  it('visitante sem identidade nenhuma vê a tela de boas-vindas', () => {
    mockAuth(null)
    mockGuest(null)

    renderWelcomeOnly()

    expect(screen.getByText('Tela de boas-vindas')).toBeInTheDocument()
  })

  it('quem já tem conta é redirecionado para /timer', () => {
    mockAuth({ id: 1, name: 'João', email: 'joao@email.com', completedSessions: 0 })
    mockGuest(null)

    renderWelcomeOnly()

    expect(screen.getByText('Tela do timer')).toBeInTheDocument()
  })

  it('quem já é guest é redirecionado para /timer', () => {
    mockAuth(null)
    mockGuest({ id: 'guest-1', name: 'Visitante', createdAt: '2026-01-01T00:00:00Z' })

    renderWelcomeOnly()

    expect(screen.getByText('Tela do timer')).toBeInTheDocument()
  })
})
