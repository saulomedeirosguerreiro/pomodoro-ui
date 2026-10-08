import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react'
import { UNAUTHORIZED_EVENT } from '../lib/apiClient'
import { authService } from '../lib/authService'
import { tokenStorage } from '../lib/tokenStorage'
import { usersService } from '../lib/usersService'
import type { UserProfile } from '../types/api'

interface AuthContextValue {
  user: UserProfile | null
  isLoading: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => void
  refreshProfile: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null)
  const [isLoading, setIsLoading] = useState(true)

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
    const handleUnauthorized = () => setUser(null)
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

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout, refreshProfile }}>
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
