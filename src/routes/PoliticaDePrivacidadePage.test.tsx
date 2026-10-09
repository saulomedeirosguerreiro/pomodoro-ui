import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import { PoliticaDePrivacidadePage } from './PoliticaDePrivacidadePage'

describe('PoliticaDePrivacidadePage', () => {
  it('renderiza o título e o link de volta', () => {
    render(
      <MemoryRouter>
        <PoliticaDePrivacidadePage />
      </MemoryRouter>,
    )

    expect(screen.getByRole('heading', { name: 'Política de Privacidade' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Voltar' })).toBeInTheDocument()
  })
})
