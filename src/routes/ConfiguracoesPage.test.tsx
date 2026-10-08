import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { SettingsProvider } from '../context/SettingsContext'
import * as notifications from '../lib/notifications'
import { ConfiguracoesPage } from './ConfiguracoesPage'

function renderPage() {
  return render(
    <SettingsProvider>
      <ConfiguracoesPage />
    </SettingsProvider>,
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
})
