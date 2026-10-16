import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { AppLoadingScreen } from './AppLoadingScreen'

/**
 * Usuário com CONTA já autenticada em /login, /cadastro ou /esqueci-minha-senha vai direto para o
 * Dashboard (L-16). Ignora `guest` de propósito: quem está em modo sem conta PRECISA conseguir abrir
 * estas telas para fazer upgrade (criar conta ou entrar numa conta já existente).
 */
export function PublicOnlyRoute() {
  const { user, isLoading } = useAuth()

  // `AppLoadingScreen` em vez de `return null`: sem token é síncrono, mas com token é uma chamada de
  // rede de verdade — e um backend lento pra acordar (cold start) pode levar essa espera a vários
  // segundos (ver `REQUEST_TIMEOUT_MS` em `apiClient.ts`), tempo demais pra deixar a tela em branco.
  if (isLoading) {
    return <AppLoadingScreen />
  }

  return user ? <Navigate to="/dashboard" replace /> : <Outlet />
}
