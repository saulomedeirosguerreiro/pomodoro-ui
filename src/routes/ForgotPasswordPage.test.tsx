import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import { ThemeProvider } from '../context/ThemeContext'
import { authService } from '../lib/authService'
import { ApiError } from '../types/api'
import { ForgotPasswordPage } from './ForgotPasswordPage'

vi.mock('../lib/authService', () => ({
  authService: { register: vi.fn(), login: vi.fn(), recoverPassword: vi.fn() },
}))

function renderForgotPasswordPage() {
  return render(
    <MemoryRouter initialEntries={['/esqueci-minha-senha']}>
      <ThemeProvider>
        <Routes>
          <Route path="/esqueci-minha-senha" element={<ForgotPasswordPage />} />
          <Route path="/login" element={<p>Tela de login</p>} />
        </Routes>
      </ThemeProvider>
    </MemoryRouter>,
  )
}

async function fillAndSubmit() {
  await userEvent.type(screen.getByLabelText('Nome'), 'João')
  await userEvent.type(screen.getByLabelText('E-mail'), 'joao@email.com')
  await userEvent.type(screen.getByLabelText('Nova senha'), 'NovaSenha123')
  await userEvent.type(screen.getByLabelText('Confirmação da nova senha'), 'NovaSenha123')
  await userEvent.click(screen.getByRole('button', { name: 'Redefinir senha' }))
}

describe('ForgotPasswordPage', () => {
  it('happy path: redefine a senha e navega para /login com mensagem de sucesso', async () => {
    vi.mocked(authService.recoverPassword).mockResolvedValue(undefined)

    renderForgotPasswordPage()
    await fillAndSubmit()

    expect(authService.recoverPassword).toHaveBeenCalledWith({
      name: 'João',
      email: 'joao@email.com',
      newPassword: 'NovaSenha123',
    })
    expect(await screen.findByText('Tela de login')).toBeInTheDocument()
  })

  it('bloqueia o envio quando a confirmação de senha não confere, sem chamar a API', async () => {
    renderForgotPasswordPage()

    await userEvent.type(screen.getByLabelText('Nome'), 'João')
    await userEvent.type(screen.getByLabelText('E-mail'), 'joao@email.com')
    await userEvent.type(screen.getByLabelText('Nova senha'), 'NovaSenha123')
    await userEvent.type(screen.getByLabelText('Confirmação da nova senha'), 'Outra123')
    await userEvent.click(screen.getByRole('button', { name: 'Redefinir senha' }))

    expect(screen.getByText('As senhas não conferem.')).toBeInTheDocument()
    expect(authService.recoverPassword).not.toHaveBeenCalled()
  })

  it('erro 404 (nome/e-mail não batem): mostra a mensagem genérica do backend', async () => {
    vi.mocked(authService.recoverPassword).mockRejectedValue(
      new ApiError(404, { code: 'not_found', message: 'Não foi possível localizar uma conta com esses dados.' }),
    )

    renderForgotPasswordPage()
    await fillAndSubmit()

    expect(await screen.findByText('Não foi possível localizar uma conta com esses dados.')).toBeInTheDocument()
  })

  it('erro 429 (rate limit): mostra aviso de muitas tentativas', async () => {
    vi.mocked(authService.recoverPassword).mockRejectedValue(
      new ApiError(429, { code: 'rate_limited', message: 'Too Many Requests' }),
    )

    renderForgotPasswordPage()
    await fillAndSubmit()

    expect(await screen.findByText('Muitas tentativas. Tente novamente mais tarde.')).toBeInTheDocument()
  })
})
