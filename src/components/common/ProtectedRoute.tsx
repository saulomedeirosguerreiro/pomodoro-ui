import { Navigate, Outlet } from 'react-router-dom'
import { WelcomeModal } from '../welcome/WelcomeModal'
import { useAuth } from '../../context/AuthContext'
import { useGuest } from '../../context/GuestContext'

/**
 * Exige identidade — conta OU guest. Sem nenhuma das duas, a rota pedida renderiza normalmente por
 * trás (`<Outlet/>`) e o modal de boas-vindas aparece por cima, como um overlay de verdade — não uma
 * página em branco à parte — EXCETO quando a ausência é por sessão de CONTA expirada (US-82, 401 do
 * `UNAUTHORIZED_EVENT`): aí vai para `/login` com um aviso, não mostra o modal (que pareceria que a
 * pessoa nunca teve conta). `LoginPage` limpa a flag ao montar via `acknowledgeSessionExpired()`.
 */
export function ProtectedRoute() {
  const { user, isLoading: authLoading, sessionExpired } = useAuth()
  const { guest, isLoading: guestLoading } = useGuest()

  if (authLoading || guestLoading) {
    return null
  }

  if (sessionExpired) {
    return <Navigate to="/login" replace state={{ message: 'Sua sessão expirou. Entre novamente.' }} />
  }

  return (
    <>
      <Outlet />
      {!user && !guest && <WelcomeModal />}
    </>
  )
}
