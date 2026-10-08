import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { AuthProvider } from '../context/AuthContext'
import { SettingsProvider } from '../context/SettingsContext'
import * as notifications from '../lib/notifications'
import { usersService } from '../lib/usersService'
import { ApiError } from '../types/api'
import { ConfiguracoesPage } from './ConfiguracoesPage'

vi.mock('../lib/usersService', () => ({
  usersService: { getMe: vi.fn(), deleteAccount: vi.fn() },
}))

function renderPage() {
  return render(
    <MemoryRouter>
      <SettingsProvider>
        <AuthProvider>
          <ConfiguracoesPage />
        </AuthProvider>
      </SettingsProvider>
    </MemoryRouter>,
  )
}

describe('ConfiguracoesPage', () => {
  afterEach(() => {
    vi.restoreAllMocks()
    localStorage.clear()
  })

  it('com permissão "default", mostra o botão para ativar notificações', () => {
    vi.spyOn(notifications, 'getNotificationPermission').mockReturnValue('default')

    renderPage()

    expect(screen.getByRole('button', { name: 'Ativar notificações do navegador' })).toBeInTheDocument()
  })

  it('clicar em ativar notificações pede permissão e, se concedida, mostra o toggle', async () => {
    vi.spyOn(notifications, 'getNotificationPermission').mockReturnValue('default')
    vi.spyOn(notifications, 'requestNotificationPermission').mockResolvedValue('granted')

    renderPage()
    await userEvent.click(screen.getByRole('button', { name: 'Ativar notificações do navegador' }))

    expect(await screen.findByLabelText(/avisar quando uma sessão terminar/i)).toBeInTheDocument()
  })

  it('com permissão negada, explica como reativar manualmente', () => {
    vi.spyOn(notifications, 'getNotificationPermission').mockReturnValue('denied')

    renderPage()

    expect(screen.getByText(/bloqueadas nas configurações do navegador/i)).toBeInTheDocument()
  })

  it('alterna "reduzir animações" e aplica no documento sem reload', async () => {
    vi.spyOn(notifications, 'getNotificationPermission').mockReturnValue('granted')

    renderPage()
    await userEvent.click(screen.getByLabelText('Reduzir animações'))

    expect(document.documentElement.dataset.reduceMotion).toBe('true')
  })

  it('mostra aviso de que o som de fim de sessão ainda não tem áudio real', () => {
    vi.spyOn(notifications, 'getNotificationPermission').mockReturnValue('granted')

    renderPage()

    expect(screen.getByText(/ainda sem arquivo de áudio nesta versão/i)).toBeInTheDocument()
  })

  it('"Excluir minha conta" revela o formulário de confirmação de senha', async () => {
    vi.spyOn(notifications, 'getNotificationPermission').mockReturnValue('granted')

    renderPage()
    await userEvent.click(screen.getByRole('button', { name: 'Excluir minha conta' }))

    expect(screen.getByLabelText(/confirme sua senha para excluir a conta/i)).toBeInTheDocument()
  })

  it('"Cancelar" esconde o formulário de exclusão de novo', async () => {
    vi.spyOn(notifications, 'getNotificationPermission').mockReturnValue('granted')

    renderPage()
    await userEvent.click(screen.getByRole('button', { name: 'Excluir minha conta' }))
    await userEvent.click(screen.getByRole('button', { name: 'Cancelar' }))

    expect(screen.queryByLabelText(/confirme sua senha para excluir a conta/i)).not.toBeInTheDocument()
  })

  it('confirmar com senha correta chama usersService.deleteAccount e desloga o usuário', async () => {
    vi.spyOn(notifications, 'getNotificationPermission').mockReturnValue('granted')
    vi.mocked(usersService.deleteAccount).mockResolvedValue(undefined)

    renderPage()
    await userEvent.click(screen.getByRole('button', { name: 'Excluir minha conta' }))
    await userEvent.type(screen.getByLabelText(/confirme sua senha para excluir a conta/i), 'Senha123')
    await userEvent.click(screen.getByRole('button', { name: 'Excluir definitivamente' }))

    expect(usersService.deleteAccount).toHaveBeenCalledWith('Senha123')
  })

  it('confirmar com senha errada mostra o erro e não desloga', async () => {
    vi.spyOn(notifications, 'getNotificationPermission').mockReturnValue('granted')
    vi.mocked(usersService.deleteAccount).mockRejectedValue(
      new ApiError(401, { code: 'unauthorized', message: 'Senha inválida.' }),
    )

    renderPage()
    await userEvent.click(screen.getByRole('button', { name: 'Excluir minha conta' }))
    await userEvent.type(screen.getByLabelText(/confirme sua senha para excluir a conta/i), 'errada')
    await userEvent.click(screen.getByRole('button', { name: 'Excluir definitivamente' }))

    expect(await screen.findByText('Senha inválida.')).toBeInTheDocument()
    expect(screen.getByLabelText(/confirme sua senha para excluir a conta/i)).toBeInTheDocument()
  })
})
