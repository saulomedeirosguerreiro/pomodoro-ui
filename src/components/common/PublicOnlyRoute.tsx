import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

/** Usuário já autenticado em /login ou /cadastro vai direto para o Dashboard (L-16). */
export function PublicOnlyRoute() {
  const { user, isLoading } = useAuth()

  if (isLoading) {
    return null
  }

  return user ? <Navigate to="/dashboard" replace /> : <Outlet />
}
