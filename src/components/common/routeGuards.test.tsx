import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import * as AuthContext from '../../context/AuthContext'
import * as GuestContext from '../../context/GuestContext'
import { ProtectedRoute } from './ProtectedRoute'
import { PublicOnlyRoute } from './PublicOnlyRoute'

/** Expõe `location.state.message` no DOM para asserção do redirect de sessão expirada (US-82). */
function LoginProbe() {
  const location = useLocation()
  const state = location.state as { message?: string } | null
  return <p>Tela de login{state?.message ? ` — ${state.message}` : ''}</p>
}

function renderProtected(initialPath: string) {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <Routes>
        <Route path="/login" element={<LoginProbe />} />
        <Route element={<ProtectedRoute />}>
          <Route path="/dashboard" element={<p>Tela do dashboard</p>} />
        </Route>
      </Routes>
    </MemoryRouter>,
  )
}

function renderPublicOnly(initialPath: string) {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <Routes>
        <Route path="/dashboard" element={<p>Tela do dashboard</p>} />
        <Route element={<PublicOnlyRoute />}>
          <Route path="/login" element={<p>Tela de login</p>} />
          <Route path="/cadastro" element={<p>Tela de cadastro</p>} />
        </Route>
      </Routes>
    </MemoryRouter>,
  )
}

function mockAuth(
  user: { id: number; name: string; email: string; completedSessions: number } | null,
  sessionExpired = false,
) {
  vi.spyOn(AuthContext, 'useAuth').mockReturnValue({
    user,
    isLoading: false,
    sessionExpired,
    login: vi.fn(),
    logout: vi.fn(),
    refreshProfile: vi.fn(),
    acknowledgeSessionExpired: vi.fn(),
  })
}

function mockGuest(
  guest: { id: string; name: string; createdAt: string } | null,
  overrides: { isGuestSessionConfirmed?: boolean; clearGuestData?: ReturnType<typeof vi.fn>; confirmGuestSession?: ReturnType<typeof vi.fn> } = {},
) {
  vi.spyOn(GuestContext, 'useGuest').mockReturnValue({
    guest,
    isLoading: false,
    isGuestSessionConfirmed: overrides.isGuestSessionConfirmed ?? true,
    startGuest: vi.fn(),
    clearGuestData: overrides.clearGuestData ?? vi.fn(),
    confirmGuestSession: overrides.confirmGuestSession ?? vi.fn(),
  })
}

describe('ProtectedRoute', () => {
  it('sem identidade nenhuma (nem conta nem guest), o modal de boas-vindas aparece por cima do dashboard, não em vez dele', () => {
    mockAuth(null)
    mockGuest(null)

    renderProtected('/dashboard')

    expect(screen.getByRole('dialog', { name: 'Boas-vindas ao Guardião Pomodoro' })).toBeInTheDocument()
    expect(screen.getByText('Tela do dashboard')).toBeInTheDocument()
  })

  it('usuário autenticado (conta) consegue ver o dashboard', () => {
    mockAuth({ id: 1, name: 'João', email: 'joao@email.com', completedSessions: 0 })
    mockGuest(null)

    renderProtected('/dashboard')

    expect(screen.getByText('Tela do dashboard')).toBeInTheDocument()
  })

  it('guest (sem conta) também consegue ver o dashboard', () => {
    mockAuth(null)
    mockGuest({ id: 'guest-1', name: 'Visitante', createdAt: '2026-01-01T00:00:00Z' })

    renderProtected('/dashboard')

    expect(screen.getByText('Tela do dashboard')).toBeInTheDocument()
  })

  it('sessão de conta expirada (401) redireciona para /login com aviso, não mostra o modal de boas-vindas (US-82)', () => {
    mockAuth(null, true)
    mockGuest(null)

    renderProtected('/dashboard')

    expect(screen.getByText('Tela de login — Sua sessão expirou. Entre novamente.')).toBeInTheDocument()
  })

  it('sessão de conta expirada também limpa dados guest residuais do dispositivo, pra não vazar pra próxima pessoa', () => {
    const clearGuestData = vi.fn()
    mockAuth(null, true)
    mockGuest(null, { clearGuestData })

    renderProtected('/dashboard')

    expect(clearGuestData).toHaveBeenCalledTimes(1)
  })

  it('sessão de conta ATIVA não mexe nos dados guest', () => {
    const clearGuestData = vi.fn()
    mockAuth({ id: 1, name: 'João', email: 'joao@email.com', completedSessions: 0 })
    mockGuest(null, { clearGuestData })

    renderProtected('/dashboard')

    expect(clearGuestData).not.toHaveBeenCalled()
  })

  it('guest carregado do localStorage que esta aba ainda não confirmou mostra o GuestIdentityConfirmModal por cima do dashboard', () => {
    mockAuth(null)
    mockGuest({ id: 'guest-1', name: 'Visitante', createdAt: '2026-01-01T00:00:00Z' }, { isGuestSessionConfirmed: false })

    renderProtected('/dashboard')

    expect(screen.getByRole('dialog', { name: 'Você está como convidado' })).toBeInTheDocument()
    expect(screen.getByText('Tela do dashboard')).toBeInTheDocument()
    expect(screen.queryByRole('dialog', { name: 'Boas-vindas ao Guardião Pomodoro' })).not.toBeInTheDocument()
  })

  it('guest já confirmado nesta sessão de navegador NÃO mostra o GuestIdentityConfirmModal', () => {
    mockAuth(null)
    mockGuest({ id: 'guest-1', name: 'Visitante', createdAt: '2026-01-01T00:00:00Z' }, { isGuestSessionConfirmed: true })

    renderProtected('/dashboard')

    expect(screen.queryByRole('dialog', { name: 'É você, Visitante?' })).not.toBeInTheDocument()
    expect(screen.getByText('Tela do dashboard')).toBeInTheDocument()
  })
})

describe('PublicOnlyRoute', () => {
  it('usuário já autenticado em /login é redirecionado ao dashboard', () => {
    mockAuth({ id: 1, name: 'João', email: 'joao@email.com', completedSessions: 0 })
    mockGuest(null)

    renderPublicOnly('/login')

    expect(screen.getByText('Tela do dashboard')).toBeInTheDocument()
  })

  it('guest acessando /login NÃO é redirecionado — precisa conseguir fazer upgrade para conta', () => {
    mockAuth(null)
    mockGuest({ id: 'guest-1', name: 'Visitante', createdAt: '2026-01-01T00:00:00Z' })

    renderPublicOnly('/login')

    expect(screen.getByText('Tela de login')).toBeInTheDocument()
  })

  it('guest acessando /cadastro NÃO é redirecionado — precisa conseguir fazer upgrade para conta', () => {
    mockAuth(null)
    mockGuest({ id: 'guest-1', name: 'Visitante', createdAt: '2026-01-01T00:00:00Z' })

    renderPublicOnly('/cadastro')

    expect(screen.getByText('Tela de cadastro')).toBeInTheDocument()
  })
})
