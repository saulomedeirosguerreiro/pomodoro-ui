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
  const mock = {
    user,
    isLoading: false,
    sessionExpired: false,
    login: vi.fn(),
    logout: vi.fn(),
    refreshProfile: vi.fn(),
    acknowledgeSessionExpired: vi.fn(),
  }
  vi.spyOn(AuthContext, 'useAuth').mockReturnValue(mock)
  return mock
}

function mockGuest(guest: { id: string; name: string; createdAt: string } | null) {
  const mock = {
    guest,
    isLoading: false,
    isGuestSessionConfirmed: true,
    startGuest: vi.fn(),
    clearGuestData: vi.fn(),
    confirmGuestSession: vi.fn(),
  }
  vi.spyOn(GuestContext, 'useGuest').mockReturnValue(mock)
  return mock
}

function mockTimer(phase: 'parado' | 'rodando' | 'pausado' = 'parado') {
  vi.spyOn(TimerContextModule, 'useTimerContext').mockReturnValue({
    type: 'foco',
    phase,
    remainingSeconds: 1500,
    totalSeconds: 1500,
    canFinalize: false,
    suggestedNextType: 'descanso_curto',
    start: vi.fn(),
    pause: vi.fn(),
    resume: vi.fn(),
    restart: vi.fn(),
    finalize: vi.fn(),
    selectType: vi.fn(),
    lastRegisteredSession: null,
    registrationError: null,
    retryRegistration: vi.fn(),
    dismissRegistrationError: vi.fn(),
    canRetryRegistration: true,
    progress: null,
    focusedTask: null,
    refreshFocusedTask: vi.fn(),
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

/** Começa numa rota diferente de `/timer` — usada pra conferir que o logout manda de volta pra lá
 *  (rota padrão do app, onde `ProtectedRoute` mostra o `WelcomeModal` sozinho sem `user`/`guest`). */
function renderShellOnTarefasRoute() {
  return render(
    <MemoryRouter initialEntries={['/tarefas']}>
      <ThemeProvider>
        <SettingsProvider>
          <LofiPlayerProvider>
            <Routes>
              <Route element={<AppShell />}>
                <Route path="/timer" element={<p>Conteúdo da página</p>} />
                <Route path="/tarefas" element={<p>Conteúdo de tarefas</p>} />
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

  it('conta: mostra nome e o botão "Sair", SEM e-mail no card de perfil', () => {
    mockAuth({ id: 1, name: 'João Silva', email: 'joao@email.com', completedSessions: 0 })
    mockGuest(null)
    mockTimer()

    renderShell()

    expect(screen.getByText('João Silva')).toBeInTheDocument()
    expect(screen.queryByText('joao@email.com')).not.toBeInTheDocument()
    // "Sair" aparece tanto no cabeçalho (desktop) quanto na sidebar — alternância por CSS
    // (`hidden lg:block`), que o jsdom não aplica, então os dois ficam no DOM ao mesmo tempo.
    expect(screen.getAllByRole('button', { name: 'Sair' }).length).toBeGreaterThan(0)
  })

  it('clicar em "Sair" confirma, limpa a sessão e o guest residual, e volta pra /timer (onde o WelcomeModal reaparece sozinho)', async () => {
    const auth = mockAuth({ id: 1, name: 'João Silva', email: 'joao@email.com', completedSessions: 0 })
    const guest = mockGuest(null)
    mockTimer('parado')
    const user = userEvent.setup()

    renderShellOnTarefasRoute()
    expect(screen.getByText('Conteúdo de tarefas')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Sair' }))

    const dialog = screen.getByRole('dialog', { name: 'Sair da sua conta?' })
    expect(within(dialog).getByText('Você pode entrar novamente quando quiser.')).toBeInTheDocument()
    expect(auth.logout).not.toHaveBeenCalled()

    await user.click(within(dialog).getByRole('button', { name: 'Sair' }))

    expect(auth.logout).toHaveBeenCalledTimes(1)
    expect(guest.clearGuestData).toHaveBeenCalledTimes(1)
    expect(await screen.findByText('Conteúdo da página')).toBeInTheDocument()
    expect(screen.queryByText('Conteúdo de tarefas')).not.toBeInTheDocument()
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('com um período em andamento: o diálogo avisa que ele será perdido, e cancelar não desloga', async () => {
    const auth = mockAuth({ id: 1, name: 'João Silva', email: 'joao@email.com', completedSessions: 0 })
    const guest = mockGuest(null)
    mockTimer('rodando')
    const user = userEvent.setup()

    renderShell()

    await user.click(screen.getByRole('button', { name: 'Sair' }))

    const dialog = screen.getByRole('dialog', { name: 'Sair da sua conta?' })
    expect(within(dialog).getByText('Há um período em andamento. Ele será perdido ao sair.')).toBeInTheDocument()

    await user.click(within(dialog).getByRole('button', { name: 'Cancelar' }))

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(auth.logout).not.toHaveBeenCalled()
    expect(guest.clearGuestData).not.toHaveBeenCalled()
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

  it('guest: botão "Acessar minha conta" fica à parte no header; menu do avatar só tem "Trocar de pessoa", que limpa o guest e volta pra /timer', async () => {
    const auth = mockAuth(null)
    const guest = mockGuest({ id: 'guest-1', name: 'Visitante', createdAt: '2026-01-01T00:00:00Z' })
    mockTimer('parado')
    const user = userEvent.setup()

    renderShellOnTarefasRoute()
    expect(screen.getByText('Conteúdo de tarefas')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Acessar minha conta' })).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Menu do visitante' }))
    expect(screen.queryByRole('menuitem', { name: 'Acessar minha conta' })).not.toBeInTheDocument()

    await user.click(screen.getByRole('menuitem', { name: 'Trocar de pessoa' }))

    const dialog = screen.getByRole('dialog', { name: 'Trocar de pessoa neste dispositivo?' })
    expect(guest.clearGuestData).not.toHaveBeenCalled()

    await user.click(within(dialog).getByRole('button', { name: 'Trocar de pessoa' }))

    expect(auth.logout).not.toHaveBeenCalled()
    expect(guest.clearGuestData).toHaveBeenCalledTimes(1)
    expect(await screen.findByText('Conteúdo da página')).toBeInTheDocument()
    expect(screen.queryByText('Conteúdo de tarefas')).not.toBeInTheDocument()
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('guest: cancelar "Trocar de pessoa" não limpa nada', async () => {
    mockAuth(null)
    const guest = mockGuest({ id: 'guest-1', name: 'Visitante', createdAt: '2026-01-01T00:00:00Z' })
    mockTimer('parado')
    const user = userEvent.setup()

    renderShell()

    await user.click(screen.getByRole('button', { name: 'Menu do visitante' }))
    await user.click(screen.getByRole('menuitem', { name: 'Trocar de pessoa' }))
    const dialog = screen.getByRole('dialog', { name: 'Trocar de pessoa neste dispositivo?' })
    await user.click(within(dialog).getByRole('button', { name: 'Cancelar' }))

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(guest.clearGuestData).not.toHaveBeenCalled()
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
      expect(dialog.getByText('João Silva')).toBeInTheDocument()
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
