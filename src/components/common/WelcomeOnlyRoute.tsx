import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useGuest } from '../../context/GuestContext'

/**
 * Simétrico a `PublicOnlyRoute`, mas para `/boas-vindas`: quem já tem QUALQUER identidade (conta OU
 * guest) vai direto para `/timer` — evita que alguém já identificado veja a tela de nome de novo ao
 * digitar `/boas-vindas` na URL.
 */
export function WelcomeOnlyRoute() {
  const { user, isLoading: authLoading } = useAuth()
  const { guest, isLoading: guestLoading } = useGuest()

  if (authLoading || guestLoading) {
    return null
  }

  return user || guest ? <Navigate to="/timer" replace /> : <Outlet />
}
