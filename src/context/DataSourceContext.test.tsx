import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import type { GuestProfile } from '../lib/guestProfile'
import type { UserProfile } from '../types/api'
import * as AuthContext from './AuthContext'
import { DataSourceProvider, useDataSource } from './DataSourceContext'
import * as GuestContext from './GuestContext'

/** Consumidor mínimo só para expor `mode`/`dataSource` nas asserções via DOM. */
function Probe() {
  const { mode, dataSource } = useDataSource()
  return (
    <p>
      modo: {mode} / dataSource: {dataSource ? 'presente' : 'ausente'}
    </p>
  )
}

function renderProbe() {
  return render(
    <DataSourceProvider>
      <Probe />
    </DataSourceProvider>,
  )
}

function mockAuth(user: UserProfile | null) {
  vi.spyOn(AuthContext, 'useAuth').mockReturnValue({
    user,
    isLoading: false,
    login: vi.fn(),
    logout: vi.fn(),
    refreshProfile: vi.fn(),
  })
}

function mockGuest(guest: GuestProfile | null) {
  vi.spyOn(GuestContext, 'useGuest').mockReturnValue({ guest })
}

describe('DataSourceContext', () => {
  it('mode "none": sem user e sem guest, dataSource é null', () => {
    mockAuth(null)
    mockGuest(null)

    renderProbe()

    expect(screen.getByText('modo: none / dataSource: ausente')).toBeInTheDocument()
  })

  it('mode "guest": sem user, com guest, dataSource presente (local)', () => {
    mockAuth(null)
    mockGuest({ id: 'guest-1', name: 'Visitante', createdAt: '2026-01-01T00:00:00Z' })

    renderProbe()

    expect(screen.getByText('modo: guest / dataSource: presente')).toBeInTheDocument()
  })

  it('mode "account": com user, dataSource presente (remoto)', () => {
    mockAuth({ id: 1, name: 'João', email: 'joao@email.com', completedSessions: 0 })
    mockGuest(null)

    renderProbe()

    expect(screen.getByText('modo: account / dataSource: presente')).toBeInTheDocument()
  })

  it('edge case: conta tem precedência sobre guest residual (localStorage órfão)', () => {
    mockAuth({ id: 1, name: 'João', email: 'joao@email.com', completedSessions: 0 })
    mockGuest({ id: 'guest-orfao', name: 'Visitante antigo', createdAt: '2026-01-01T00:00:00Z' })

    renderProbe()

    expect(screen.getByText('modo: account / dataSource: presente')).toBeInTheDocument()
  })
})
