import { useEffect } from 'react'
import { Navigate, Outlet } from 'react-router-dom'
import { GuestIdentityConfirmModal } from '../welcome/GuestIdentityConfirmModal'
import { WelcomeModal } from '../welcome/WelcomeModal'
import { useAuth } from '../../context/AuthContext'
import { useGuest } from '../../context/GuestContext'

/**
 * Exige identidade — conta OU guest. Sem nenhuma das duas, a rota pedida renderiza normalmente por
 * trás (`<Outlet/>`) e o modal de boas-vindas aparece por cima, como um overlay de verdade — não uma
 * página em branco à parte — EXCETO quando a ausência é por sessão de CONTA expirada (US-82, 401 do
 * `UNAUTHORIZED_EVENT`): aí vai para `/login` com um aviso, não mostra o modal (que pareceria que a
 * pessoa nunca teve conta). `LoginPage` limpa a flag ao montar via `acknowledgeSessionExpired()`.
 *
 * Quando há um `guest` carregado do `localStorage` mas esta aba ainda não confirmou que é a mesma
 * pessoa (`!isGuestSessionConfirmed` — ver `GuestContext`), mostra o `GuestIdentityConfirmModal` em vez
 * de seguir direto: é o caso de alguém ter fechado o navegador e outra pessoa ter aberto depois no
 * mesmo dispositivo. As duas condições de overlay são mutuamente exclusivas (uma exige `guest` nulo, a
 * outra `guest` presente), então nunca aparecem os dois modais ao mesmo tempo.
 */
export function ProtectedRoute() {
  const { user, isLoading: authLoading, sessionExpired } = useAuth()
  const { guest, isLoading: guestLoading, isGuestSessionConfirmed, clearGuestData } = useGuest()

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

  const needsGuestIdentityConfirm = !user && Boolean(guest) && !isGuestSessionConfirmed

  return (
    <>
      <Outlet />
      {!user && !guest && <WelcomeModal />}
      {needsGuestIdentityConfirm && <GuestIdentityConfirmModal />}
    </>
  )
}
