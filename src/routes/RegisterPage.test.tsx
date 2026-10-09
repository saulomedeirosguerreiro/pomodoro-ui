import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import * as AuthContext from '../context/AuthContext'
import * as GuestContext from '../context/GuestContext'
import * as ThemeContext from '../context/ThemeContext'
import { authService } from '../lib/authService'
import { hasAnyLocalGuestData } from '../lib/localDataWipe'
import { migrationService } from '../lib/migrationService'
import type { ImportGuestDataResponse } from '../lib/migrationService'
import { RegisterPage } from './RegisterPage'

vi.mock('../lib/authService', () => ({
  authService: { register: vi.fn(), login: vi.fn() },
}))

vi.mock('../lib/localDataWipe', () => ({
  hasAnyLocalGuestData: vi.fn(),
  wipeAllLocalGuestData: vi.fn(),
}))

vi.mock('../lib/migrationService', () => ({
  migrationService: { importLocalData: vi.fn() },
  buildImportRequestFromLocalData: vi.fn(() => ({ guestId: 'guest-1', tasks: [], sessions: [] })),
}))

function renderRegisterPage() {
  return render(
    <MemoryRouter initialEntries={['/cadastro']}>
      <Routes>
        <Route path="/cadastro" element={<RegisterPage />} />
        <Route path="/login" element={<p>Tela de login</p>} />
        <Route path="/timer" element={<p>Tela do timer</p>} />
      </Routes>
    </MemoryRouter>,
  )
}

function mockGuest(name: string | null = null) {
  const clearGuestData = vi.fn()
  vi.spyOn(GuestContext, 'useGuest').mockReturnValue({
    guest: name ? { id: 'guest-1', name, createdAt: '2026-01-01T00:00:00Z' } : null,
    isLoading: false,
    startGuest: vi.fn(),
    clearGuestData,
  })
  return clearGuestData
}

function mockAuth(refreshProfile = vi.fn().mockResolvedValue(undefined)) {
  vi.spyOn(AuthContext, 'useAuth').mockReturnValue({
    user: null,
    isLoading: false,
    sessionExpired: false,
    login: vi.fn(),
    logout: vi.fn(),
    refreshProfile,
    acknowledgeSessionExpired: vi.fn(),
  })
  return refreshProfile
}

async function fillAndSubmit() {
  await userEvent.type(screen.getByLabelText('Nome'), 'João')
  await userEvent.type(screen.getByLabelText('E-mail'), 'joao@email.com')
  await userEvent.type(screen.getByLabelText('Senha'), 'Senha123')
  await userEvent.type(screen.getByLabelText('Confirmação de senha'), 'Senha123')
  await userEvent.click(screen.getByRole('button', { name: 'Cadastrar' }))
}

function buildResponse(skipped: ImportGuestDataResponse['skipped'] = []): ImportGuestDataResponse {
  return {
    importId: 1,
    guestId: 'guest-1',
    importedAt: '2026-01-01T00:00:00Z',
    tasksImported: 1,
    sessionsImported: 2,
    achievementsUnlocked: [],
    skipped,
  }
}

describe('RegisterPage', () => {
  beforeEach(() => {
    // AuthLayout renderiza o ThemeToggle, que depende do ThemeProvider real (montado só em App.tsx).
    vi.spyOn(ThemeContext, 'useTheme').mockReturnValue({ theme: 'light', toggleTheme: vi.fn() })
  })

  afterEach(() => {
    localStorage.clear()
  })

  it('bloqueia o envio quando a confirmação de senha não confere, sem chamar a API', async () => {
    mockGuest()
    mockAuth()

    render(
      <MemoryRouter>
        <RegisterPage />
      </MemoryRouter>,
    )

    await userEvent.type(screen.getByLabelText('Nome'), 'João')
    await userEvent.type(screen.getByLabelText('E-mail'), 'joao@email.com')
    await userEvent.type(screen.getByLabelText('Senha'), 'Senha123')
    await userEvent.type(screen.getByLabelText('Confirmação de senha'), 'Outra123')
    await userEvent.click(screen.getByRole('button', { name: 'Cadastrar' }))

    expect(screen.getByText('As senhas não conferem.')).toBeInTheDocument()
    expect(authService.register).not.toHaveBeenCalled()
  })

  it('campo nome vem pré-preenchido quando há guest.name', () => {
    mockGuest('Visitante Curioso')
    mockAuth()

    render(
      <MemoryRouter>
        <RegisterPage />
      </MemoryRouter>,
    )

    expect(screen.getByLabelText('Nome')).toHaveValue('Visitante Curioso')
  })

  it('cadastro sem dados locais pendentes: fluxo atual intacto, navega para /login com banner de sucesso', async () => {
    mockGuest()
    mockAuth()
    vi.mocked(authService.register).mockResolvedValue({ id: 1, name: 'João', email: 'joao@email.com' })
    vi.mocked(hasAnyLocalGuestData).mockReturnValue(false)

    renderRegisterPage()
    await fillAndSubmit()

    expect(await screen.findByText('Tela de login')).toBeInTheDocument()
    expect(authService.login).not.toHaveBeenCalled()
    expect(migrationService.importLocalData).not.toHaveBeenCalled()
  })

  it('cadastro com dados locais pendentes importa automaticamente, sem diálogo, e navega para /timer quando nada foi pulado', async () => {
    const clearGuestData = mockGuest('Visitante')
    const refreshProfile = mockAuth()
    vi.mocked(authService.register).mockResolvedValue({ id: 1, name: 'Visitante', email: 'joao@email.com' })
    vi.mocked(authService.login).mockResolvedValue({ token: 'tok-123', user: { id: 1, name: 'Visitante', email: 'joao@email.com' } })
    vi.mocked(hasAnyLocalGuestData).mockReturnValue(true)
    vi.mocked(migrationService.importLocalData).mockResolvedValue(buildResponse([]))

    renderRegisterPage()
    await fillAndSubmit()

    expect(await screen.findByText('Tela do timer')).toBeInTheDocument()
    expect(migrationService.importLocalData).toHaveBeenCalledWith({ guestId: 'guest-1', tasks: [], sessions: [] })
    expect(clearGuestData).toHaveBeenCalledTimes(1)
    expect(refreshProfile).toHaveBeenCalledTimes(1)
    expect(screen.queryByText('Importação concluída')).not.toBeInTheDocument()
  })

  it('cadastro com dados locais pendentes e itens pulados mostra o MigrationReport antes de navegar', async () => {
    mockGuest('Visitante')
    const refreshProfile = mockAuth()
    vi.mocked(authService.register).mockResolvedValue({ id: 1, name: 'Visitante', email: 'joao@email.com' })
    vi.mocked(authService.login).mockResolvedValue({ token: 'tok-123', user: { id: 1, name: 'Visitante', email: 'joao@email.com' } })
    vi.mocked(hasAnyLocalGuestData).mockReturnValue(true)
    vi.mocked(migrationService.importLocalData).mockResolvedValue(
      buildResponse([{ itemType: 'task', localId: '5', reason: 'Dados inválidos.' }]),
    )

    renderRegisterPage()
    await fillAndSubmit()

    expect(await screen.findByText('Importação concluída')).toBeInTheDocument()
    expect(screen.queryByText('Tela do timer')).not.toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: 'Entendi' }))

    expect(refreshProfile).toHaveBeenCalledTimes(1)
    expect(await screen.findByText('Tela do timer')).toBeInTheDocument()
  })

  it('falha ao importar após o cadastro: não apaga dados locais e manda para /login com aviso', async () => {
    const clearGuestData = mockGuest('Visitante')
    mockAuth()
    vi.mocked(authService.register).mockResolvedValue({ id: 1, name: 'Visitante', email: 'joao@email.com' })
    vi.mocked(authService.login).mockRejectedValue(new Error('login falhou'))
    vi.mocked(hasAnyLocalGuestData).mockReturnValue(true)

    renderRegisterPage()
    await fillAndSubmit()

    expect(await screen.findByText('Tela de login')).toBeInTheDocument()
    expect(clearGuestData).not.toHaveBeenCalled()
    expect(migrationService.importLocalData).not.toHaveBeenCalled()
  })
})
