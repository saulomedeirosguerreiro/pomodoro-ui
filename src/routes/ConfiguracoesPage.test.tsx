import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { AuthProvider } from '../context/AuthContext'
import * as DataSourceContextModule from '../context/DataSourceContext'
import * as GuestContextModule from '../context/GuestContext'
import { SettingsProvider } from '../context/SettingsContext'
import { ThemeProvider } from '../context/ThemeContext'
import * as notifications from '../lib/notifications'
import { usersService } from '../lib/usersService'
import { ApiError } from '../types/api'
import { ConfiguracoesPage } from './ConfiguracoesPage'

vi.mock('../lib/usersService', () => ({
  usersService: { getMe: vi.fn(), deleteAccount: vi.fn() },
}))

function mockDataSourceMode(mode: 'account' | 'guest') {
  vi.spyOn(DataSourceContextModule, 'useDataSource').mockReturnValue({ dataSource: null, mode })
}

function mockGuest(clearGuestData = vi.fn()) {
  vi.spyOn(GuestContextModule, 'useGuest').mockReturnValue({
    guest: { id: 'guest-1', name: 'Visitante', createdAt: '2026-01-01T00:00:00Z' },
    isLoading: false,
    startGuest: vi.fn(),
    clearGuestData,
  })
  return clearGuestData
}

function renderPage() {
  return render(
    <MemoryRouter>
      <ThemeProvider>
        <SettingsProvider>
          <AuthProvider>
            <ConfiguracoesPage />
          </AuthProvider>
        </SettingsProvider>
      </ThemeProvider>
    </MemoryRouter>,
  )
}

/** Única diferença de setup frente a `renderPage()`: expõe `/timer` para checar o redirect pós-apagamento
 *  (sem `guest`, `ProtectedRoute` mostraria o modal de boas-vindas por cima dessa rota — aqui só
 *  interessa confirmar o `navigate`, não o guard em si). */
function renderPageWithTimerRoute() {
  return render(
    <MemoryRouter initialEntries={['/configuracoes']}>
      <Routes>
        <Route
          path="/configuracoes"
          element={
            <ThemeProvider>
              <SettingsProvider>
                <AuthProvider>
                  <ConfiguracoesPage />
                </AuthProvider>
              </SettingsProvider>
            </ThemeProvider>
          }
        />
        <Route path="/timer" element={<p>Tela do timer</p>} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('ConfiguracoesPage', () => {
  afterEach(() => {
    vi.restoreAllMocks()
    localStorage.clear()
  })

  describe('mode: account', () => {
    beforeEach(() => {
      mockDataSourceMode('account')
      mockGuest()
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

  describe('mode: guest', () => {
    beforeEach(() => {
      mockDataSourceMode('guest')
    })

    it('mostra "Apagar meus dados deste dispositivo" em vez de "Excluir conta", sem pedir senha', () => {
      mockGuest()
      vi.spyOn(notifications, 'getNotificationPermission').mockReturnValue('granted')

      renderPage()

      expect(screen.getByRole('heading', { name: 'Apagar meus dados deste dispositivo' })).toBeInTheDocument()
      expect(screen.queryByRole('heading', { name: 'Excluir conta' })).not.toBeInTheDocument()
      expect(screen.queryByLabelText(/confirme sua senha/i)).not.toBeInTheDocument()
    })

    it('confirmar no diálogo chama clearGuestData e navega para /timer', async () => {
      const clearGuestData = mockGuest()
      vi.spyOn(notifications, 'getNotificationPermission').mockReturnValue('granted')

      renderPageWithTimerRoute()
      await userEvent.click(screen.getByRole('button', { name: 'Apagar meus dados deste dispositivo' }))
      await userEvent.click(screen.getByRole('button', { name: 'Apagar definitivamente' }))

      expect(clearGuestData).toHaveBeenCalledTimes(1)
      expect(await screen.findByText('Tela do timer')).toBeInTheDocument()
    })

    it('"Cancelar" no diálogo fecha sem apagar nada', async () => {
      const clearGuestData = mockGuest()
      vi.spyOn(notifications, 'getNotificationPermission').mockReturnValue('granted')

      renderPage()
      await userEvent.click(screen.getByRole('button', { name: 'Apagar meus dados deste dispositivo' }))
      await userEvent.click(screen.getByRole('button', { name: 'Cancelar' }))

      expect(screen.queryByText('Apagar todos os dados deste dispositivo?')).not.toBeInTheDocument()
      expect(clearGuestData).not.toHaveBeenCalled()
    })
  })
})
