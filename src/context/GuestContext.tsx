import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react'
import {
  createGuestProfile,
  loadGuestProfile,
  saveGuestProfile,
  type GuestProfile,
} from '../lib/guestProfile'
import { ackGuestSession, hasAckedGuestSession } from '../lib/guestSessionAck'
import { wipeAllLocalGuestData } from '../lib/localDataWipe'

interface GuestContextValue {
  guest: GuestProfile | null
  /** Hidratação do `localStorage` no mount — sempre síncrona hoje (sem rede), mantido por simetria com
   *  `AuthContextValue.isLoading` para os guards de rota não precisarem checar dois formatos de loading. */
  isLoading: boolean
  /** `false` só quando um `guest` foi carregado do `localStorage` no boot desta aba SEM que esta mesma
   *  aba o tenha criado — ou seja, "achamos um perfil de visitante que já existia antes desta sessão de
   *  navegador". É o gatilho do `GuestIdentityConfirmModal` (`ProtectedRoute`). */
  isGuestSessionConfirmed: boolean
  startGuest: (name: string) => void
  /** `wipeAllLocalGuestData()` já limpa o perfil junto com tarefas/sessões/conquistas — usado por
   *  "apagar dados deste dispositivo" (ConfiguracoesPage, Frente 4) e após uma migração concluída/descartada. */
  clearGuestData: () => void
  /** Confirma que quem está usando o app agora é dona do `guest` carregado no boot — grava a flag de
   *  sessão (`guestSessionAck`) pra não perguntar de novo até o navegador fechar. */
  confirmGuestSession: () => void
}

const GuestContext = createContext<GuestContextValue | undefined>(undefined)

/** Identidade local (modo sem conta): `{id, name}` persistido em `localStorage` via `lib/guestProfile.ts`. */
export function GuestProvider({ children }: { children: ReactNode }) {
  const [guest, setGuest] = useState<GuestProfile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isGuestSessionConfirmed, setIsGuestSessionConfirmed] = useState(false)

  useEffect(() => {
    setGuest(loadGuestProfile())
    // Síncrono (sessionStorage), resolvido no mesmo tick do boot — sem precisar de loading à parte.
    setIsGuestSessionConfirmed(hasAckedGuestSession())
    setIsLoading(false)
  }, [])

  const startGuest = useCallback((name: string) => {
    const profile = createGuestProfile(name)
    saveGuestProfile(profile)
    setGuest(profile)
    // Perfil criado agora, nesta própria aba — não há "outra pessoa" a confirmar depois.
    ackGuestSession()
    setIsGuestSessionConfirmed(true)
  }, [])

  const confirmGuestSession = useCallback(() => {
    ackGuestSession()
    setIsGuestSessionConfirmed(true)
  }, [])

  const clearGuestData = useCallback(() => {
    wipeAllLocalGuestData()
    setGuest(null)
  }, [])

  return (
    <GuestContext.Provider
      value={{ guest, isLoading, isGuestSessionConfirmed, startGuest, clearGuestData, confirmGuestSession }}
    >
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
