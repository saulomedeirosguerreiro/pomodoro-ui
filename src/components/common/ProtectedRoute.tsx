import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

/** Usuário não autenticado tentando acessar o Dashboard vai para o Login (US-04 RI, L-16). */
export function ProtectedRoute() {
  const { user, isLoading } = useAuth()

  if (isLoading) {
    return null
  }

  return user ? <Outlet /> : <Navigate to="/login" replace />
}
