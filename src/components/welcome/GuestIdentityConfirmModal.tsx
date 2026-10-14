import { Link } from 'react-router-dom'
import { Badge } from '../common/Badge'
import { Button } from '../common/Button'
import { Dialog } from '../common/Dialog'
import { useGuest } from '../../context/GuestContext'

/**
 * Renderizado por `ProtectedRoute` quando há um `guest` carregado do `localStorage` que esta aba ainda
 * não confirmou (ver `GuestContext.isGuestSessionConfirmed`) — ou seja, a pessoa que abriu o navegador
 * agora pode não ser a mesma que criou esse perfil de visitante. Não dismissível (igual ao
 * `WelcomeModal`): força uma das três escolhas antes de liberar o app.
 */
export function GuestIdentityConfirmModal() {
  const { guest, confirmGuestSession, clearGuestData } = useGuest()

  if (!guest) {
    return null
  }

  return (
    <Dialog
      titleText="Você está como convidado"
      dismissible={false}
      centerTitle
      header={
        <div className="mb-4 flex flex-col items-center gap-3">
          <span
            aria-hidden="true"
            className="flex h-16 w-16 items-center justify-center rounded-full bg-primary-bg text-style-headline-sm text-primary-dark"
          >
            {guest.name.charAt(0).toUpperCase()}
          </span>
          <Badge>
            <span aria-hidden="true">👤</span> Modo convidado
          </Badge>
        </div>
      }
    >
      <p className="mb-4 text-center text-style-body-md text-text">
        É você, <strong>{guest.name}</strong>? Continue de onde parou ou entre como outra pessoa.
      </p>

      <div className="flex flex-col gap-3">
        <Button fullWidth onClick={confirmGuestSession}>
          Continuar como {guest.name}
        </Button>
        <Button variant="ghost" fullWidth onClick={clearGuestData}>
          Não sou o {guest.name}
        </Button>
      </div>

      <hr className="mt-6 border-t border-border" />

      <p className="mt-4 text-center text-style-body-sm text-text-muted">
        Já tem uma conta?{' '}
        <Link to="/login" onClick={clearGuestData} className="font-semibold text-text-h underline">
          Entrar
        </Link>
      </p>
    </Dialog>
  )
}
