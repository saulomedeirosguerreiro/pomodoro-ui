import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '../common/Button'
import { Dialog } from '../common/Dialog'
import { FormField } from '../common/FormField'
import { useGuest } from '../../context/GuestContext'

const NAME_MAX_LENGTH = 60

/**
 * Primeiro contato de quem abre o app sem conta: um modal (não uma página própria) que só pede um
 * nome, guardado localmente, e libera o app inteiro. Renderizado por `ProtectedRoute` por cima da
 * rota pedida quando não há identidade nenhuma; some sozinho assim que `startGuest` popula o
 * `GuestContext`, porque o guard passa a renderizar o `<Outlet/>` no próximo render.
 */
export function WelcomeModal() {
  const { startGuest } = useGuest()
  const [name, setName] = useState('')
  const [error, setError] = useState<string | null>(null)

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    const trimmedName = name.trim()

    if (trimmedName.length === 0) {
      setError('Conte pra gente como podemos te chamar.')
      return
    }
    if (trimmedName.length > NAME_MAX_LENGTH) {
      setError(`O nome pode ter no máximo ${NAME_MAX_LENGTH} caracteres.`)
      return
    }

    setError(null)
    startGuest(trimmedName)
  }

  return (
    <Dialog titleText="Boas-vindas ao PomoGarden" dismissible={false}>
      <p className="mb-4 text-style-body-md text-text">
        Use o PomoGarden sem precisar criar conta. Seus dados ficam só neste navegador.
      </p>

      <form onSubmit={handleSubmit} noValidate>
        <FormField
          label="Como podemos te chamar?"
          name="name"
          autoComplete="given-name"
          required
          maxLength={NAME_MAX_LENGTH}
          value={name}
          onChange={(e) => setName(e.target.value)}
          error={error ?? undefined}
        />
        <Button type="submit" fullWidth>
          Começar
        </Button>
      </form>

      <Link to="/login" className="mt-4 block text-center [font:700_13px/18px_var(--font-sans)] text-primary-dark">
        Já tenho conta
      </Link>
    </Dialog>
  )
}
