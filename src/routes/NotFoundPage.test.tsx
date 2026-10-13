import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import { NotFoundPage } from './NotFoundPage'

function renderNotFound(initialPath: string) {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <Routes>
        <Route path="/timer" element={<p>Tela do timer</p>} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('NotFoundPage', () => {
  it('rota desconhecida mostra a página 404', () => {
    renderNotFound('/rota-que-nao-existe')

    expect(screen.getByRole('heading', { name: 'Página não encontrada' })).toBeInTheDocument()
  })

  it('clicar em "Voltar para o Timer" navega para /timer', async () => {
    const user = userEvent.setup()
    renderNotFound('/rota-que-nao-existe')

    await user.click(screen.getByRole('button', { name: 'Voltar para o Timer' }))

    expect(screen.getByText('Tela do timer')).toBeInTheDocument()
  })
})
