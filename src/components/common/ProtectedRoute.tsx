import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useGuest } from '../../context/GuestContext'

/**
 * Exige identidade — conta OU guest. Sem nenhuma das duas, manda para a tela de boas-vindas —
 * EXCETO quando a ausência é por sessão de CONTA expirada (US-82, 401 do `UNAUTHORIZED_EVENT`): aí
 * vai para `/login` com um aviso, não para `/boas-vindas` (que pareceria que a pessoa nunca teve
 * conta). `LoginPage` limpa a flag ao montar via `acknowledgeSessionExpired()`.
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

  return user || guest ? <Outlet /> : <Navigate to="/boas-vindas" replace />
}
