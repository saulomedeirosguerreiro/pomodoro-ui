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
    <Dialog titleText="Boas-vindas ao Guardião Pomodoro" dismissible={false}>
      <p className="mb-4 text-style-body-md text-text">
        Use o Guardião Pomodoro sem precisar criar conta. Seus dados ficam só neste navegador.
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

      <hr className="mt-6 border-t border-border" />

      <p className="mt-6 text-center text-style-body-sm text-text-muted">
        Já tem conta ou quer usar em outros aparelhos?
      </p>

      <div className="mt-4 flex gap-3">
        <Link
          to="/login"
          className="inline-flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-full border-2 border-border bg-bg-subtle px-6 py-3 text-style-label-lg text-text-h transition-[transform,box-shadow] duration-150 ease-out active:translate-y-0.5"
        >
          Entrar
        </Link>

        <Link
          to="/cadastro"
          className="inline-flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-full border-2 border-border bg-bg-subtle px-6 py-3 text-style-label-lg text-text-h transition-[transform,box-shadow] duration-150 ease-out active:translate-y-0.5"
        >
          Criar conta
        </Link>
      </div>
    </Dialog>
  )
}
