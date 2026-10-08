import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react'
import {
  createGuestProfile,
  loadGuestProfile,
  saveGuestProfile,
  type GuestProfile,
} from '../lib/guestProfile'
import { wipeAllLocalGuestData } from '../lib/localDataWipe'

interface GuestContextValue {
  guest: GuestProfile | null
  /** Hidratação do `localStorage` no mount — sempre síncrona hoje (sem rede), mantido por simetria com
   *  `AuthContextValue.isLoading` para os guards de rota não precisarem checar dois formatos de loading. */
  isLoading: boolean
  startGuest: (name: string) => void
  /** `wipeAllLocalGuestData()` já limpa o perfil junto com tarefas/sessões/conquistas — usado por
   *  "apagar dados deste dispositivo" (ConfiguracoesPage, Frente 4) e após uma migração concluída/descartada. */
  clearGuestData: () => void
}

const GuestContext = createContext<GuestContextValue | undefined>(undefined)

/** Identidade local (modo sem conta): `{id, name}` persistido em `localStorage` via `lib/guestProfile.ts`. */
export function GuestProvider({ children }: { children: ReactNode }) {
  const [guest, setGuest] = useState<GuestProfile | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    setGuest(loadGuestProfile())
    setIsLoading(false)
  }, [])

  const startGuest = useCallback((name: string) => {
    const profile = createGuestProfile(name)
    saveGuestProfile(profile)
    setGuest(profile)
  }, [])

  const clearGuestData = useCallback(() => {
    wipeAllLocalGuestData()
    setGuest(null)
  }, [])

  return (
    <GuestContext.Provider value={{ guest, isLoading, startGuest, clearGuestData }}>
      {children}
    </GuestContext.Provider>
  )
}

export function useGuest(): GuestContextValue {
  const context = useContext(GuestContext)
  if (!context) {
    throw new Error('useGuest precisa ser usado dentro de um GuestProvider.')
  }
  return context
}
