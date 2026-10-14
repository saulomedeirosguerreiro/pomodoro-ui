import { useEffect } from 'react'
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
  const { guest, isLoading: guestLoading, clearGuestData } = useGuest()

  useEffect(() => {
    // Mesmo motivo do `clearGuestData()` no logout explícito (AppShell.confirmLogout): sem isso, um
    // perfil guest residual no dispositivo (de antes de criar conta, ou de outra pessoa) ficaria
    // pronto pra "vazar" pra quem usar o aparelho em seguida, assim que a sessão de conta cair.
    if (sessionExpired) {
      clearGuestData()
    }
  }, [sessionExpired, clearGuestData])

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
