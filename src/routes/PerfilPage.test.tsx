import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'
import * as AuthContext from '../context/AuthContext'
import * as TimerContextModule from '../context/TimerContext'
import { usersService } from '../lib/usersService'
import type { ProgressSummary } from '../types/api'
import { ApiError } from '../types/api'
import { PerfilPage } from './PerfilPage'

vi.mock('../lib/usersService', () => ({
  usersService: { updateName: vi.fn(), changePassword: vi.fn() },
}))

function mockAuth(user: { id: number; name: string; email: string; completedSessions: number } | null) {
  const refreshProfile = vi.fn().mockResolvedValue(undefined)
  vi.spyOn(AuthContext, 'useAuth').mockReturnValue({
    user,
    isLoading: false,
    sessionExpired: false,
    login: vi.fn(),
    logout: vi.fn(),
    refreshProfile,
    acknowledgeSessionExpired: vi.fn(),
  })
  return refreshProfile
}

function mockTimer(progress: ProgressSummary | null = null) {
  vi.spyOn(TimerContextModule, 'useTimerContext').mockReturnValue({
    type: 'foco',
    phase: 'parado',
    remainingSeconds: 1500,
    totalSeconds: 1500,
    canFinalize: false,
    suggestedNextType: 'descanso_curto',
    cycleCount: 0,
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
    progress,
    focusedTask: null,
    refreshFocusedTask: vi.fn(),
    events: [],
    markEventsSeen: vi.fn(),
  })
}

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/perfil']}>
      <Routes>
        <Route path="/perfil" element={<PerfilPage />} />
        <Route path="/timer" element={<p>Tela do timer</p>} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('PerfilPage', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('guest (sem user): redireciona para /timer', () => {
    mockAuth(null)
    mockTimer()

    renderPage()

    expect(screen.getByText('Tela do timer')).toBeInTheDocument()
  })

  it('conta: mostra o cabeçalho de identidade (avatar, nome, e-mail) e o nome pré-preenchido no formulário', () => {
    mockAuth({ id: 1, name: 'João Silva', email: 'joao@email.com', completedSessions: 0 })
    mockTimer()

    renderPage()

    expect(screen.getByText('João Silva')).toBeInTheDocument()
    expect(screen.getByText('joao@email.com')).toBeInTheDocument()
    expect(screen.getByText('J')).toBeInTheDocument()
    expect(screen.getByLabelText('Nome')).toHaveValue('João Silva')
  })

  it('conta com progresso: mostra nível, XP e streak no cabeçalho de identidade', () => {
    mockAuth({ id: 1, name: 'João Silva', email: 'joao@email.com', completedSessions: 0 })
    mockTimer({
      level: 3,
      title: 'Semente Curiosa',
      xpInLevel: 25,
      xpForNextLevel: 200,
      totalXp: 425,
      seeds: 10,
      streakDays: 5,
      isStreakAtRiskToday: false,
      todayFocusCount: 1,
      todayFocusSeconds: 1500,
    })

    renderPage()

    expect(screen.getByText('Nível 3 • Semente Curiosa')).toBeInTheDocument()
    expect(screen.getByText('25/200 XP')).toBeInTheDocument()
    expect(screen.getByText('🔥 5 dias seguidos')).toBeInTheDocument()
  })

  it('salvar nome com sucesso chama usersService.updateName, atualiza o perfil e mostra banner', async () => {
    const user = userEvent.setup()
    const refreshProfile = mockAuth({ id: 1, name: 'João Silva', email: 'joao@email.com', completedSessions: 0 })
    mockTimer()
    vi.mocked(usersService.updateName).mockResolvedValue({
      id: 1,
      name: 'João Atualizado',
      email: 'joao@email.com',
      completedSessions: 0,
    })

    renderPage()
    await user.clear(screen.getByLabelText('Nome'))
    await user.type(screen.getByLabelText('Nome'), 'João Atualizado')
    await user.click(screen.getByRole('button', { name: 'Salvar nome' }))

    expect(usersService.updateName).toHaveBeenCalledWith('João Atualizado')
    expect(await screen.findByText('Nome atualizado.')).toBeInTheDocument()
    expect(refreshProfile).toHaveBeenCalledTimes(1)
  })

  it('salvar nome com erro da API mostra a mensagem de erro', async () => {
    const user = userEvent.setup()
    mockAuth({ id: 1, name: 'João Silva', email: 'joao@email.com', completedSessions: 0 })
    mockTimer()
    vi.mocked(usersService.updateName).mockRejectedValue(
      new ApiError(422, { code: 'validation_error', message: 'Nome inválido.' }),
    )

    renderPage()
    await user.click(screen.getByRole('button', { name: 'Salvar nome' }))

    expect(await screen.findByText('Nome inválido.')).toBeInTheDocument()
  })

  it('senhas diferentes: mostra erro de confirmação sem chamar a API', async () => {
    const user = userEvent.setup()
    mockAuth({ id: 1, name: 'João Silva', email: 'joao@email.com', completedSessions: 0 })
    mockTimer()

    renderPage()
    await user.type(screen.getByLabelText('Senha atual'), 'SenhaAtual1')
    await user.type(screen.getByLabelText('Nova senha'), 'SenhaNova123')
    await user.type(screen.getByLabelText('Confirmar nova senha'), 'OutraSenha456')
    await user.click(screen.getByRole('button', { name: 'Salvar senha' }))

    expect(await screen.findByText('As senhas não conferem.')).toBeInTheDocument()
    expect(usersService.changePassword).not.toHaveBeenCalled()
  })

  it('trocar senha com sucesso chama usersService.changePassword, limpa os campos e mostra banner', async () => {
    const user = userEvent.setup()
    mockAuth({ id: 1, name: 'João Silva', email: 'joao@email.com', completedSessions: 0 })
    mockTimer()
    vi.mocked(usersService.changePassword).mockResolvedValue(undefined)

    renderPage()
    await user.type(screen.getByLabelText('Senha atual'), 'SenhaAtual1')
    await user.type(screen.getByLabelText('Nova senha'), 'SenhaNova123')
    await user.type(screen.getByLabelText('Confirmar nova senha'), 'SenhaNova123')
    await user.click(screen.getByRole('button', { name: 'Salvar senha' }))

    expect(usersService.changePassword).toHaveBeenCalledWith('SenhaAtual1', 'SenhaNova123')
    expect(await screen.findByText('Senha atualizada.')).toBeInTheDocument()
    expect(screen.getByLabelText('Senha atual')).toHaveValue('')
    expect(screen.getByLabelText('Nova senha')).toHaveValue('')
  })

  it('trocar senha com senha atual errada mostra o erro de campo', async () => {
    const user = userEvent.setup()
    mockAuth({ id: 1, name: 'João Silva', email: 'joao@email.com', completedSessions: 0 })
    mockTimer()
    const error = new ApiError(401, { code: 'invalid_credentials', message: 'Senha atual inválida.' })
    vi.mocked(usersService.changePassword).mockRejectedValue(error)

    renderPage()
    await user.type(screen.getByLabelText('Senha atual'), 'errada')
    await user.type(screen.getByLabelText('Nova senha'), 'SenhaNova123')
    await user.type(screen.getByLabelText('Confirmar nova senha'), 'SenhaNova123')
    await user.click(screen.getByRole('button', { name: 'Salvar senha' }))

    expect(await screen.findByText('Senha atual inválida.')).toBeInTheDocument()
  })
})
