import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import * as AuthContext from '../context/AuthContext'
import * as GuestContext from '../context/GuestContext'
import * as ThemeContext from '../context/ThemeContext'
import { hasAnyLocalGuestData } from '../lib/localDataWipe'
import { ApiError } from '../types/api'
import { LoginPage } from './LoginPage'

vi.mock('../lib/localDataWipe', () => ({
  hasAnyLocalGuestData: vi.fn(),
  wipeAllLocalGuestData: vi.fn(),
}))

vi.mock('../lib/migrationService', () => ({
  migrationService: { importLocalData: vi.fn() },
  buildImportRequestFromLocalData: vi.fn(() => ({ guestId: 'guest-1', tasks: [], sessions: [] })),
}))

function renderLoginPage() {
  return render(
    <MemoryRouter initialEntries={['/login']}>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/timer" element={<p>Tela do timer</p>} />
      </Routes>
    </MemoryRouter>,
  )
}

function mockGuest() {
  vi.spyOn(GuestContext, 'useGuest').mockReturnValue({
    guest: { id: 'guest-1', name: 'Visitante', createdAt: '2026-01-01T00:00:00Z' },
    isLoading: false,
    startGuest: vi.fn(),
    clearGuestData: vi.fn(),
  })
}

function mockAuth(login = vi.fn().mockResolvedValue(undefined)) {
  const acknowledgeSessionExpired = vi.fn()
  vi.spyOn(AuthContext, 'useAuth').mockReturnValue({
    user: null,
    isLoading: false,
    sessionExpired: false,
    login,
    logout: vi.fn(),
    refreshProfile: vi.fn(),
    acknowledgeSessionExpired,
  })
  return { acknowledgeSessionExpired }
}

async function submitLogin() {
  await userEvent.type(screen.getByLabelText('E-mail'), 'joao@email.com')
  await userEvent.type(screen.getByLabelText('Senha'), 'correta')
  await userEvent.click(screen.getByRole('button', { name: 'Entrar' }))
}

describe('LoginPage', () => {
  beforeEach(() => {
    // AuthLayout renderiza o ThemeToggle, que depende do ThemeProvider real (montado só em App.tsx).
    vi.spyOn(ThemeContext, 'useTheme').mockReturnValue({ theme: 'light', toggleTheme: vi.fn() })
  })

  it('mostra mensagem genérica de erro quando o login falha', async () => {
    mockGuest()
    vi.mocked(hasAnyLocalGuestData).mockReturnValue(false)
    mockAuth(vi.fn().mockRejectedValue(new ApiError(401, { code: 'unauthorized', message: 'E-mail ou senha inválidos.' })))

    renderLoginPage()
    await submitLogin()

    expect(await screen.findByText('E-mail ou senha inválidos.')).toBeInTheDocument()
  })

  it('login sem dados locais pendentes navega direto para /timer (comportamento atual preservado)', async () => {
    mockGuest()
    vi.mocked(hasAnyLocalGuestData).mockReturnValue(false)
    mockAuth()

    renderLoginPage()
    await submitLogin()

    expect(await screen.findByText('Tela do timer')).toBeInTheDocument()
  })

  it('login com dados locais pendentes mostra o diálogo de 3 opções ANTES de navegar (US-85)', async () => {
    mockGuest()
    vi.mocked(hasAnyLocalGuestData).mockReturnValue(true)
    mockAuth()

    renderLoginPage()
    await submitLogin()

    expect(await screen.findByText('Você tem dados salvos neste navegador')).toBeInTheDocument()
    expect(screen.queryByText('Tela do timer')).not.toBeInTheDocument()
  })

  it('ao montar, limpa a flag de sessão expirada (US-82)', () => {
    mockGuest()
    const { acknowledgeSessionExpired } = mockAuth()

    renderLoginPage()

    expect(acknowledgeSessionExpired).toHaveBeenCalledTimes(1)
  })
})
