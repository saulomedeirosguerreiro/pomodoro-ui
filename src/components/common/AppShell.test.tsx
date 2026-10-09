import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'
import * as AuthContext from '../../context/AuthContext'
import * as GuestContext from '../../context/GuestContext'
import * as TimerContextModule from '../../context/TimerContext'
import { LofiPlayerProvider } from '../../context/LofiPlayerContext'
import { SettingsProvider } from '../../context/SettingsContext'
import { ThemeProvider } from '../../context/ThemeContext'
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
    totalSeconds: 1500,
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
    canRetryRegistration: true,
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
      <ThemeProvider>
        <SettingsProvider>
          <LofiPlayerProvider>
            <Routes>
              <Route element={<AppShell />}>
                <Route path="/timer" element={<p>Conteúdo da página</p>} />
              </Route>
            </Routes>
          </LofiPlayerProvider>
        </SettingsProvider>
      </ThemeProvider>
    </MemoryRouter>,
  )
}

/** Só pra testar o fechamento do menu ao navegar — precisa de uma 2ª rota de verdade pra não
 *  desmontar o `AppShell` inteiro (rota sem correspondência faria o `Routes` não renderizar nada). */
function renderShellWithAjudaRoute() {
  return render(
    <MemoryRouter initialEntries={['/timer']}>
      <ThemeProvider>
        <SettingsProvider>
          <LofiPlayerProvider>
            <Routes>
              <Route element={<AppShell />}>
                <Route path="/timer" element={<p>Conteúdo da página</p>} />
                <Route path="/ajuda" element={<p>Conteúdo da ajuda</p>} />
              </Route>
            </Routes>
          </LofiPlayerProvider>
        </SettingsProvider>
      </ThemeProvider>
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

  it('sem identidade nenhuma: mostra um placeholder "Visitante" em vez de página em branco (fica por trás do modal de boas-vindas, renderizado por ProtectedRoute)', () => {
    mockAuth(null)
    mockGuest(null)
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

  describe('menu hambúrguer (mobile)', () => {
    it('começa fechado e abre ao clicar no botão "Abrir menu"', async () => {
      mockAuth({ id: 1, name: 'João Silva', email: 'joao@email.com', completedSessions: 0 })
      mockGuest(null)
      mockTimer()
      const user = userEvent.setup()

      renderShell()

      expect(screen.queryByRole('dialog', { name: 'Menu' })).not.toBeInTheDocument()

      await user.click(screen.getByRole('button', { name: 'Abrir menu' }))

      expect(screen.getByRole('dialog', { name: 'Menu' })).toBeInTheDocument()
    })

    it('o menu traz o mesmo conteúdo da sidebar desktop: perfil, navegação e links secundários', async () => {
      mockAuth({ id: 1, name: 'João Silva', email: 'joao@email.com', completedSessions: 0 })
      mockGuest(null)
      mockTimer()
      const user = userEvent.setup()

      renderShell()
      await user.click(screen.getByRole('button', { name: 'Abrir menu' }))

      const dialog = within(screen.getByRole('dialog', { name: 'Menu' }))
      expect(dialog.getByText('joao@email.com')).toBeInTheDocument()
      expect(dialog.getByRole('link', { name: /Timer/ })).toBeInTheDocument()
      expect(dialog.getByRole('link', { name: 'Configurações' })).toBeInTheDocument()
      expect(dialog.getByRole('link', { name: 'Ajuda' })).toBeInTheDocument()
      expect(dialog.getByText('© 2026 Guardião Pomodoro — Saulo Guerreiro')).toBeInTheDocument()
      expect(dialog.getByRole('button', { name: 'Sair' })).toBeInTheDocument()
    })

    it('fecha ao clicar no botão "Fechar menu"', async () => {
      mockAuth(null)
      mockGuest({ id: 'guest-1', name: 'Visitante', createdAt: '2026-01-01T00:00:00Z' })
      mockTimer()
      const user = userEvent.setup()

      renderShell()
      await user.click(screen.getByRole('button', { name: 'Abrir menu' }))
      await user.click(screen.getByRole('button', { name: 'Fechar menu' }))

      expect(screen.queryByRole('dialog', { name: 'Menu' })).not.toBeInTheDocument()
    })

    it('fecha ao clicar no backdrop', async () => {
      mockAuth(null)
      mockGuest({ id: 'guest-1', name: 'Visitante', createdAt: '2026-01-01T00:00:00Z' })
      mockTimer()
      const user = userEvent.setup()

      renderShell()
      await user.click(screen.getByRole('button', { name: 'Abrir menu' }))
      await user.click(screen.getByTestId('menu-backdrop'))

      expect(screen.queryByRole('dialog', { name: 'Menu' })).not.toBeInTheDocument()
    })

    it('fecha ao navegar por um link de dentro do menu', async () => {
      mockAuth(null)
      mockGuest({ id: 'guest-1', name: 'Visitante', createdAt: '2026-01-01T00:00:00Z' })
      mockTimer()
      const user = userEvent.setup()

      renderShellWithAjudaRoute()
      await user.click(screen.getByRole('button', { name: 'Abrir menu' }))
      const dialog = within(screen.getByRole('dialog', { name: 'Menu' }))
      await user.click(dialog.getByRole('link', { name: 'Ajuda' }))

      expect(await screen.findByText('Conteúdo da ajuda')).toBeInTheDocument()
      expect(screen.queryByRole('dialog', { name: 'Menu' })).not.toBeInTheDocument()
    })
  })
})
