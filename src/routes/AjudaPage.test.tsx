import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { AjudaPage } from './AjudaPage'

describe('AjudaPage', () => {
  it('explica as durações reais de foco e pausas', () => {
    render(<AjudaPage />)

    expect(screen.getByText(/25 min/)).toBeInTheDocument()
    expect(screen.getByText(/5 min/)).toBeInTheDocument()
    expect(screen.getByText(/15 min/)).toBeInTheDocument()
  })

  it('explica XP, sementes e nível com os números reais das constantes', () => {
    render(<AjudaPage />)

    expect(screen.getByText(/25 XP/)).toBeInTheDocument()
    expect(screen.getByText(/15 sementes/)).toBeInTheDocument()
    expect(screen.getByText(/10 sementes/)).toBeInTheDocument()
  })

  it('lista as espécies do jardim', () => {
    render(<AjudaPage />)

    expect(screen.getByText(/Tomatinho/)).toBeInTheDocument()
    expect(screen.getByText(/Moranguinho/)).toBeInTheDocument()
  })
})
