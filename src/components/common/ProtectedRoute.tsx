import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useGuest } from '../../context/GuestContext'

/** Exige identidade — conta OU guest. Sem nenhuma das duas, manda para a tela de boas-vindas. */
export function ProtectedRoute() {
  const { user, isLoading: authLoading } = useAuth()
  const { guest, isLoading: guestLoading } = useGuest()

  if (authLoading || guestLoading) {
    return null
  }

  return user || guest ? <Outlet /> : <Navigate to="/boas-vindas" replace />
}
