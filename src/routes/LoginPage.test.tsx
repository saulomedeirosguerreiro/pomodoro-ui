import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import * as AuthContext from '../context/AuthContext'
import { ApiError } from '../types/api'
import { LoginPage } from './LoginPage'

describe('LoginPage', () => {
  it('mostra mensagem genérica de erro quando o login falha', async () => {
    vi.spyOn(AuthContext, 'useAuth').mockReturnValue({
      user: null,
      isLoading: false,
      login: vi.fn().mockRejectedValue(new ApiError(401, { code: 'unauthorized', message: 'E-mail ou senha inválidos.' })),
      logout: vi.fn(),
      refreshProfile: vi.fn(),
    })

    render(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>,
    )

    await userEvent.type(screen.getByLabelText('E-mail'), 'joao@email.com')
    await userEvent.type(screen.getByLabelText('Senha'), 'errada')
    await userEvent.click(screen.getByRole('button', { name: 'Entrar' }))

    expect(await screen.findByText('E-mail ou senha inválidos.')).toBeInTheDocument()
  })
})
