import { createContext, useContext, type ReactNode } from 'react'
import { useSessionRegistration } from './useSessionRegistration'

type SessionRegistrationContextValue = ReturnType<typeof useSessionRegistration>

const SessionRegistrationContext = createContext<SessionRegistrationContextValue | undefined>(undefined)

/**
 * Contexto fino em volta de `useSessionRegistration()` (Parte 4 do plano), provido uma única vez em
 * `TimerScope` — consumido tanto por `TimerProvider` (modo clássico) quanto por
 * `FlexibleTimerProvider` (modo flexível), garantindo que XP/conquistas/toasts/notificação/som sejam
 * a mesma instância de estado para os dois modos.
 */
export function SessionRegistrationProvider({ children }: { children: ReactNode }) {
  const value = useSessionRegistration()
  return <SessionRegistrationContext.Provider value={value}>{children}</SessionRegistrationContext.Provider>
}

export function useSessionRegistrationContext(): SessionRegistrationContextValue {
  const context = useContext(SessionRegistrationContext)
  if (!context) {
    throw new Error('useSessionRegistrationContext precisa ser usado dentro de um SessionRegistrationProvider.')
  }
  return context
}
