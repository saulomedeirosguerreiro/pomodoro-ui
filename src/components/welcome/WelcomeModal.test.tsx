import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import * as GuestContext from '../../context/GuestContext'
import { WelcomeModal } from './WelcomeModal'

function renderWelcomeModal() {
  return render(
    <MemoryRouter initialEntries={['/timer']}>
      <Routes>
        <Route path="/timer" element={<WelcomeModal />} />
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

describe('WelcomeModal', () => {
  it('aparece como um diálogo modal, não como página própria', () => {
    mockGuest()

    renderWelcomeModal()

    expect(screen.getByRole('dialog', { name: 'Boas-vindas ao PomoGarden' })).toBeInTheDocument()
  })

  it('submit com nome vazio não avança: mostra erro e não chama startGuest', async () => {
    const startGuest = mockGuest()

    renderWelcomeModal()

    await userEvent.click(screen.getByRole('button', { name: 'Começar' }))

    expect(screen.getByText('Conte pra gente como podemos te chamar.')).toBeInTheDocument()
    expect(startGuest).not.toHaveBeenCalled()
  })

  it('submit com nome chama startGuest', async () => {
    const startGuest = mockGuest()

    renderWelcomeModal()

    await userEvent.type(screen.getByLabelText('Como podemos te chamar?'), 'Maria')
    await userEvent.click(screen.getByRole('button', { name: 'Começar' }))

    expect(startGuest).toHaveBeenCalledWith('Maria')
  })

  it('link "Já tenho conta" leva para /login', async () => {
    mockGuest()

    renderWelcomeModal()

    await userEvent.click(screen.getByRole('link', { name: 'Já tenho conta' }))

    expect(await screen.findByText('Tela de login')).toBeInTheDocument()
  })
})
