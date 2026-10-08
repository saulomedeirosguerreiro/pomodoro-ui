import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react'
import { UNAUTHORIZED_EVENT } from '../lib/apiClient'
import { authService } from '../lib/authService'
import { tokenStorage } from '../lib/tokenStorage'
import { usersService } from '../lib/usersService'
import type { UserProfile } from '../types/api'

interface AuthContextValue {
  user: UserProfile | null
  isLoading: boolean
  /**
   * US-82: true quando a sessão caiu por 401 (token expirado/inválido), não por `logout()` explícito.
   * Distingue "a pessoa tinha conta e foi derrubada" de "a pessoa nunca se identificou" — o guard de
   * rota usa isso para mandar para `/login` com aviso, em vez de `/boas-vindas` (que pareceria que ela
   * nunca teve conta).
   */
  sessionExpired: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => void
  refreshProfile: () => Promise<void>
  /** Limpa a flag depois do redirect ser tratado (ex.: ao montar `LoginPage`). */
  acknowledgeSessionExpired: () => void
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [sessionExpired, setSessionExpired] = useState(false)

  const refreshProfile = useCallback(async () => {
    const profile = await usersService.getMe()
    setUser(profile)
  }, [])

  useEffect(() => {
    if (!tokenStorage.get()) {
      setIsLoading(false)
      return
    }

    refreshProfile()
      .catch(() => setUser(null))
      .finally(() => setIsLoading(false))
  }, [refreshProfile])

  useEffect(() => {
    const handleUnauthorized = () => {
      setUser(null)
      setSessionExpired(true)
    }
    window.addEventListener(UNAUTHORIZED_EVENT, handleUnauthorized)
    return () => window.removeEventListener(UNAUTHORIZED_EVENT, handleUnauthorized)
  }, [])

  const login = useCallback(async (email: string, password: string) => {
    const { token } = await authService.login({ email, password })
    tokenStorage.set(token)
    await refreshProfile()
  }, [refreshProfile])

  const logout = useCallback(() => {
    tokenStorage.clear()
    setUser(null)
  }, [])

  const acknowledgeSessionExpired = useCallback(() => setSessionExpired(false), [])

  return (
    <AuthContext.Provider
      value={{ user, isLoading, sessionExpired, login, logout, refreshProfile, acknowledgeSessionExpired }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth precisa ser usado dentro de um AuthProvider.')
  }
  return context
}
