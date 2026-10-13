import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { FormField } from './FormField'

describe('FormField', () => {
  it('campo comum (ex.: e-mail) não mostra o botão de olho', () => {
    render(<FormField label="E-mail" name="email" type="email" value="" onChange={vi.fn()} />)

    expect(screen.getByLabelText('E-mail')).toHaveAttribute('type', 'email')
    expect(screen.queryByRole('button', { name: /mostrar senha/i })).not.toBeInTheDocument()
  })

  it('campo de senha começa oculto, com o botão "Mostrar senha"', () => {
    render(<FormField label="Senha" name="password" type="password" value="" onChange={vi.fn()} />)

    expect(screen.getByLabelText('Senha')).toHaveAttribute('type', 'password')
    expect(screen.getByRole('button', { name: 'Mostrar senha' })).toBeInTheDocument()
  })

  it('clicar no olho revela a senha (type="text") e troca pra "Ocultar senha"; clicar de novo oculta', async () => {
    const user = userEvent.setup()
    render(<FormField label="Senha" name="password" type="password" value="minhaSenha123" onChange={vi.fn()} />)

    await user.click(screen.getByRole('button', { name: 'Mostrar senha' }))

    expect(screen.getByLabelText('Senha')).toHaveAttribute('type', 'text')
    expect(screen.getByRole('button', { name: 'Ocultar senha' })).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Ocultar senha' }))

    expect(screen.getByLabelText('Senha')).toHaveAttribute('type', 'password')
    expect(screen.getByRole('button', { name: 'Mostrar senha' })).toBeInTheDocument()
  })

  it('mostra a mensagem de erro e marca o campo como inválido', () => {
    render(
      <FormField label="Senha" name="password" type="password" value="" onChange={vi.fn()} error="Senha inválida." />,
    )

    expect(screen.getByText('Senha inválida.')).toBeInTheDocument()
    expect(screen.getByLabelText('Senha')).toHaveAttribute('aria-invalid', 'true')
  })
})
