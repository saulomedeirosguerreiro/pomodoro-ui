import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import { VisitorMenu } from './VisitorMenu'

function renderMenu(onSwitchPerson = vi.fn()) {
  render(
    <MemoryRouter>
      <VisitorMenu firstName="Visitante" onSwitchPerson={onSwitchPerson} />
    </MemoryRouter>,
  )
  return onSwitchPerson
}

describe('VisitorMenu', () => {
  it('começa fechado, mostrando só o avatar (inicial do nome)', () => {
    renderMenu()

    expect(screen.getByRole('button', { name: 'Menu do visitante' })).toHaveTextContent('V')
    expect(screen.queryByRole('menu')).not.toBeInTheDocument()
  })

  it('abre ao clicar no avatar, mostrando "Trocar de pessoa" ("Acessar minha conta" é um botão à parte no header, não um item deste menu)', async () => {
    const user = userEvent.setup()
    renderMenu()

    await user.click(screen.getByRole('button', { name: 'Menu do visitante' }))

    expect(screen.getByRole('menu')).toBeInTheDocument()
    expect(screen.getByRole('menuitem', { name: 'Trocar de pessoa' })).toBeInTheDocument()
    expect(screen.queryByRole('menuitem', { name: 'Acessar minha conta' })).not.toBeInTheDocument()
  })

  it('fecha ao clicar fora', async () => {
    const user = userEvent.setup()
    renderMenu()

    await user.click(screen.getByRole('button', { name: 'Menu do visitante' }))
    expect(screen.getByRole('menu')).toBeInTheDocument()

    await user.click(document.body)

    expect(screen.queryByRole('menu')).not.toBeInTheDocument()
  })

  it('fecha com Escape', async () => {
    const user = userEvent.setup()
    renderMenu()

    await user.click(screen.getByRole('button', { name: 'Menu do visitante' }))
    expect(screen.getByRole('menu')).toBeInTheDocument()

    await user.keyboard('{Escape}')

    expect(screen.queryByRole('menu')).not.toBeInTheDocument()
  })

  it('clicar em "Trocar de pessoa" chama onSwitchPerson e fecha o menu', async () => {
    const user = userEvent.setup()
    const onSwitchPerson = renderMenu()

    await user.click(screen.getByRole('button', { name: 'Menu do visitante' }))
    await user.click(screen.getByRole('menuitem', { name: 'Trocar de pessoa' }))

    expect(onSwitchPerson).toHaveBeenCalledTimes(1)
    expect(screen.queryByRole('menu')).not.toBeInTheDocument()
  })
})
