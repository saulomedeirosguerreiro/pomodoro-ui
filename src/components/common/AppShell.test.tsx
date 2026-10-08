import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'
import * as AuthContext from '../../context/AuthContext'
import * as GuestContext from '../../context/GuestContext'
import * as TimerContextModule from '../../context/TimerContext'
import { SettingsProvider } from '../../context/SettingsContext'
import { AppShell } from './AppShell'

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

function mockTimer() {
  vi.spyOn(TimerContextModule, 'useTimerContext').mockReturnValue({
    type: 'foco',
    phase: 'parado',
    remainingSeconds: 1500,
    canFinalize: false,
    start: vi.fn(),
    pause: vi.fn(),
    resume: vi.fn(),
    restart: vi.fn(),
    finalize: vi.fn(),
    selectType: vi.fn(),
    skip: vi.fn(),
    lastRegisteredSession: null,
    registrationError: null,
    retryRegistration: vi.fn(),
    progress: null,
    rewardToast: null,
    dismissRewardToast: vi.fn(),
    focusedTask: null,
    refreshFocusedTask: vi.fn(),
    achievementToast: null,
    dismissAchievementToast: vi.fn(),
    events: [],
    markEventsSeen: vi.fn(),
  })
}

function renderShell() {
  return render(
    <MemoryRouter initialEntries={['/timer']}>
      <SettingsProvider>
        <Routes>
          <Route element={<AppShell />}>
            <Route path="/timer" element={<p>Conteúdo da página</p>} />
          </Route>
        </Routes>
      </SettingsProvider>
    </MemoryRouter>,
  )
}

describe('AppShell', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('conta: mostra nome, e-mail e o botão "Sair"', () => {
    mockAuth({ id: 1, name: 'João Silva', email: 'joao@email.com', completedSessions: 0 })
    mockGuest(null)
    mockTimer()

    renderShell()

    expect(screen.getByText('João Silva')).toBeInTheDocument()
    expect(screen.getByText('joao@email.com')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Sair' })).toBeInTheDocument()
  })

  it('guest: mostra o nome do guest, SEM e-mail e SEM o botão "Sair" (não vira página em branco)', () => {
    mockAuth(null)
    mockGuest({ id: 'guest-1', name: 'Visitante', createdAt: '2026-01-01T00:00:00Z' })
    mockTimer()

    renderShell()

    expect(screen.getByText('Visitante')).toBeInTheDocument()
    expect(screen.getByText('Conteúdo da página')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Sair' })).not.toBeInTheDocument()
  })

  it('conta tem precedência sobre um perfil guest residual no localStorage', () => {
    mockAuth({ id: 1, name: 'João Silva', email: 'joao@email.com', completedSessions: 0 })
    mockGuest({ id: 'guest-orfao', name: 'Visitante antigo', createdAt: '2026-01-01T00:00:00Z' })
    mockTimer()

    renderShell()

    expect(screen.getByText('João Silva')).toBeInTheDocument()
    expect(screen.queryByText('Visitante antigo')).not.toBeInTheDocument()
  })
})
