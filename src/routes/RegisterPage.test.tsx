import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import { authService } from '../lib/authService'
import { RegisterPage } from './RegisterPage'

vi.mock('../lib/authService', () => ({
  authService: { register: vi.fn(), login: vi.fn() },
}))

describe('RegisterPage', () => {
  it('bloqueia o envio quando a confirmação de senha não confere, sem chamar a API', async () => {
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
})
