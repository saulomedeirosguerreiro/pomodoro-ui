import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import * as GuestContext from '../context/GuestContext'
import { WelcomePage } from './WelcomePage'

function renderWelcomePage() {
  return render(
    <MemoryRouter initialEntries={['/boas-vindas']}>
      <Routes>
        <Route path="/boas-vindas" element={<WelcomePage />} />
        <Route path="/timer" element={<p>Tela do timer</p>} />
        <Route path="/login" element={<p>Tela de login</p>} />
      </Routes>
    </MemoryRouter>,
  )
}

function mockGuest(startGuest = vi.fn()) {
  vi.spyOn(GuestContext, 'useGuest').mockReturnValue({
    guest: null,
    isLoading: false,
    startGuest,
    clearGuestData: vi.fn(),
  })
  return startGuest
}

describe('WelcomePage', () => {
  it('submit com nome vazio não avança: mostra erro e não chama startGuest', async () => {
    const startGuest = mockGuest()

    renderWelcomePage()

    await userEvent.click(screen.getByRole('button', { name: 'Começar' }))

    expect(screen.getByText('Conte pra gente como podemos te chamar.')).toBeInTheDocument()
    expect(startGuest).not.toHaveBeenCalled()
    expect(screen.queryByText('Tela do timer')).not.toBeInTheDocument()
  })

  it('submit com nome chama startGuest e navega para /timer', async () => {
    const startGuest = mockGuest()

    renderWelcomePage()

    await userEvent.type(screen.getByLabelText('Como podemos te chamar?'), 'Maria')
    await userEvent.click(screen.getByRole('button', { name: 'Começar' }))

    expect(startGuest).toHaveBeenCalledWith('Maria')
    expect(await screen.findByText('Tela do timer')).toBeInTheDocument()
  })

  it('link "Já tenho conta" leva para /login', async () => {
    mockGuest()

    renderWelcomePage()

    await userEvent.click(screen.getByRole('link', { name: 'Já tenho conta' }))

    expect(await screen.findByText('Tela de login')).toBeInTheDocument()
  })
})
