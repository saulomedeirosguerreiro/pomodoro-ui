import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import { CopyrightPage } from './CopyrightPage'

describe('CopyrightPage', () => {
  it('renderiza o título e o link de volta', () => {
    render(
      <MemoryRouter>
        <CopyrightPage />
      </MemoryRouter>,
    )

    expect(screen.getByRole('heading', { name: 'Copyright' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Voltar' })).toBeInTheDocument()
  })
})
