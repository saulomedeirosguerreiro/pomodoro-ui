import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import * as GuestContext from '../../context/GuestContext'
import { GuestIdentityConfirmModal } from './GuestIdentityConfirmModal'

const guest = { id: 'guest-1', name: 'Maria', createdAt: '2026-01-01T00:00:00Z' }

function renderModal() {
  return render(
    <MemoryRouter initialEntries={['/timer']}>
      <Routes>
        <Route path="/timer" element={<GuestIdentityConfirmModal />} />
        <Route path="/login" element={<p>Tela de login</p>} />
      </Routes>
    </MemoryRouter>,
  )
}

function mockGuest(
  overrides: {
    confirmGuestSession?: ReturnType<typeof vi.fn<() => void>>
    clearGuestData?: ReturnType<typeof vi.fn<() => void>>
  } = {},
) {
  const confirmGuestSession = overrides.confirmGuestSession ?? vi.fn()
  const clearGuestData = overrides.clearGuestData ?? vi.fn()
  vi.spyOn(GuestContext, 'useGuest').mockReturnValue({
    guest,
    isLoading: false,
    isGuestSessionConfirmed: false,
    startGuest: vi.fn(),
    clearGuestData,
    confirmGuestSession,
  })
  return { confirmGuestSession, clearGuestData }
}

describe('GuestIdentityConfirmModal', () => {
  it('mostra o nome do guest salvo e aparece como diálogo', () => {
    mockGuest()

    renderModal()

    expect(screen.getByRole('dialog', { name: 'Você está como convidado' })).toBeInTheDocument()
    expect(screen.getByText('Maria', { selector: 'strong' })).toBeInTheDocument()
  })

  it('"Continuar como {nome}" chama confirmGuestSession e não mexe nos dados', async () => {
    const { confirmGuestSession, clearGuestData } = mockGuest()

    renderModal()

    await userEvent.click(screen.getByRole('button', { name: 'Continuar como Maria' }))

    expect(confirmGuestSession).toHaveBeenCalledTimes(1)
    expect(clearGuestData).not.toHaveBeenCalled()
  })

  it('"Não sou o {nome}" chama clearGuestData', async () => {
    const { clearGuestData, confirmGuestSession } = mockGuest()

    renderModal()

    await userEvent.click(screen.getByRole('button', { name: 'Não sou o Maria' }))

    expect(clearGuestData).toHaveBeenCalledTimes(1)
    expect(confirmGuestSession).not.toHaveBeenCalled()
  })

  it('"Entrar" chama clearGuestData e leva para /login', async () => {
    const { clearGuestData } = mockGuest()

    renderModal()

    await userEvent.click(screen.getByRole('link', { name: 'Entrar' }))

    expect(clearGuestData).toHaveBeenCalledTimes(1)
    expect(await screen.findByText('Tela de login')).toBeInTheDocument()
  })
})
