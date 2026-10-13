import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'
import * as AuthContext from '../context/AuthContext'
import { usersService } from '../lib/usersService'
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

    renderPage()

    expect(screen.getByText('Tela do timer')).toBeInTheDocument()
  })

  it('conta: mostra o nome atual pré-preenchido', () => {
    mockAuth({ id: 1, name: 'João Silva', email: 'joao@email.com', completedSessions: 0 })

    renderPage()

    expect(screen.getByLabelText('Nome')).toHaveValue('João Silva')
  })

  it('salvar nome com sucesso chama usersService.updateName, atualiza o perfil e mostra banner', async () => {
    const user = userEvent.setup()
    const refreshProfile = mockAuth({ id: 1, name: 'João Silva', email: 'joao@email.com', completedSessions: 0 })
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
