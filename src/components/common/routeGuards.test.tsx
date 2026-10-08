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
        <Route path="/boas-vindas" element={<p>Tela de boas-vindas</p>} />
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

function mockGuest(guest: { id: string; name: string; createdAt: string } | null) {
  vi.spyOn(GuestContext, 'useGuest').mockReturnValue({
    guest,
    isLoading: false,
    startGuest: vi.fn(),
    clearGuestData: vi.fn(),
  })
}

describe('ProtectedRoute', () => {
  it('sem identidade nenhuma (nem conta nem guest), tentando abrir o dashboard é redirecionado às boas-vindas', () => {
    mockAuth(null)
    mockGuest(null)

    renderProtected('/dashboard')

    expect(screen.getByText('Tela de boas-vindas')).toBeInTheDocument()
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

  it('sessão de conta expirada (401) redireciona para /login com aviso, não para /boas-vindas (US-82)', () => {
    mockAuth(null, true)
    mockGuest(null)

    renderProtected('/dashboard')

    expect(screen.getByText('Tela de login — Sua sessão expirou. Entre novamente.')).toBeInTheDocument()
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
