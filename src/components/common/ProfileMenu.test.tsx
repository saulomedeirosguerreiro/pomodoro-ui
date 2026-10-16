import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import { LanguageProvider } from '../../context/LanguageContext'
import { ProfileMenu } from './ProfileMenu'

function renderMenu(onLogout = vi.fn()) {
  render(
    <MemoryRouter>
      <LanguageProvider>
        <ProfileMenu firstName="João" onLogout={onLogout} />
      </LanguageProvider>
    </MemoryRouter>,
  )
  return onLogout
}

describe('ProfileMenu', () => {
  it('começa fechado, mostrando só o avatar (inicial do nome)', () => {
    renderMenu()

    expect(screen.getByRole('button', { name: 'Menu da conta' })).toHaveTextContent('J')
    expect(screen.queryByRole('menu')).not.toBeInTheDocument()
  })

  it('abre ao clicar no avatar, mostrando "Perfil", "Configurações" e "Sair"', async () => {
    const user = userEvent.setup()
    renderMenu()

    await user.click(screen.getByRole('button', { name: 'Menu da conta' }))

    expect(screen.getByRole('menu')).toBeInTheDocument()
    expect(screen.getByRole('menuitem', { name: 'Perfil' })).toHaveAttribute('href', '/perfil')
    expect(screen.getByRole('menuitem', { name: 'Configurações' })).toHaveAttribute('href', '/configuracoes')
    expect(screen.getByRole('menuitem', { name: 'Sair' })).toBeInTheDocument()
  })

  it('ordem do menu: Perfil, Configurações, Sair', async () => {
    const user = userEvent.setup()
    renderMenu()

    await user.click(screen.getByRole('button', { name: 'Menu da conta' }))

    const items = screen.getAllByRole('menuitem')
    expect(items.map((item) => item.textContent)).toEqual(['Perfil', 'Configurações', 'Sair'])
  })

  it('fecha ao clicar fora', async () => {
    const user = userEvent.setup()
    renderMenu()

    await user.click(screen.getByRole('button', { name: 'Menu da conta' }))
    expect(screen.getByRole('menu')).toBeInTheDocument()

    await user.click(document.body)

    expect(screen.queryByRole('menu')).not.toBeInTheDocument()
  })

  it('fecha com Escape', async () => {
    const user = userEvent.setup()
    renderMenu()

    await user.click(screen.getByRole('button', { name: 'Menu da conta' }))
    expect(screen.getByRole('menu')).toBeInTheDocument()

    await user.keyboard('{Escape}')

    expect(screen.queryByRole('menu')).not.toBeInTheDocument()
  })

  it('clicar em "Sair" chama onLogout e fecha o menu', async () => {
    const user = userEvent.setup()
    const onLogout = renderMenu()

    await user.click(screen.getByRole('button', { name: 'Menu da conta' }))
    await user.click(screen.getByRole('menuitem', { name: 'Sair' }))

    expect(onLogout).toHaveBeenCalledTimes(1)
    expect(screen.queryByRole('menu')).not.toBeInTheDocument()
  })
})
