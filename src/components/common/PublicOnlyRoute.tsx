import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

/**
 * Usuário com CONTA já autenticada em /login, /cadastro ou /esqueci-minha-senha vai direto para o
 * Dashboard (L-16). Ignora `guest` de propósito: quem está em modo sem conta PRECISA conseguir abrir
 * estas telas para fazer upgrade (criar conta ou entrar numa conta já existente).
 */
export function PublicOnlyRoute() {
  const { user, isLoading } = useAuth()

  if (isLoading) {
    return null
  }

  return user ? <Navigate to="/dashboard" replace /> : <Outlet />
}
