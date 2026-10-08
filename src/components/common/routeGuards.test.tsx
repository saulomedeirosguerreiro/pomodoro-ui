import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import * as AuthContext from '../../context/AuthContext'
import { ProtectedRoute } from './ProtectedRoute'
import { PublicOnlyRoute } from './PublicOnlyRoute'

function renderProtected(initialPath: string) {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <Routes>
        <Route path="/login" element={<p>Tela de login</p>} />
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
        </Route>
      </Routes>
    </MemoryRouter>,
  )
}

describe('ProtectedRoute', () => {
  it('usuário não autenticado tentando abrir o dashboard é redirecionado ao login', () => {
    vi.spyOn(AuthContext, 'useAuth').mockReturnValue({
      user: null,
      isLoading: false,
      login: vi.fn(),
      logout: vi.fn(),
      refreshProfile: vi.fn(),
    })

    renderProtected('/dashboard')

    expect(screen.getByText('Tela de login')).toBeInTheDocument()
  })

  it('usuário autenticado consegue ver o dashboard', () => {
    vi.spyOn(AuthContext, 'useAuth').mockReturnValue({
      user: { id: 1, name: 'João', email: 'joao@email.com', completedSessions: 0 },
      isLoading: false,
      login: vi.fn(),
      logout: vi.fn(),
      refreshProfile: vi.fn(),
    })

    renderProtected('/dashboard')

    expect(screen.getByText('Tela do dashboard')).toBeInTheDocument()
  })
})

describe('PublicOnlyRoute', () => {
  it('usuário já autenticado em /login é redirecionado ao dashboard', () => {
    vi.spyOn(AuthContext, 'useAuth').mockReturnValue({
      user: { id: 1, name: 'João', email: 'joao@email.com', completedSessions: 0 },
      isLoading: false,
      login: vi.fn(),
      logout: vi.fn(),
      refreshProfile: vi.fn(),
    })

    renderPublicOnly('/login')

    expect(screen.getByText('Tela do dashboard')).toBeInTheDocument()
  })
})
