import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import { TermosDeUsoPage } from './TermosDeUsoPage'

describe('TermosDeUsoPage', () => {
  it('renderiza o título e o link de volta', () => {
    render(
      <MemoryRouter>
        <TermosDeUsoPage />
      </MemoryRouter>,
    )

    expect(screen.getByRole('heading', { name: 'Termos de Uso' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Voltar' })).toBeInTheDocument()
  })
})
