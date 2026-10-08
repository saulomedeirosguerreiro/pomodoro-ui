import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import buttons from '../components/common/buttons.module.css'
import { AuthLayout } from '../components/common/AuthLayout'
import { Button } from '../components/common/Button'
import { FormField } from '../components/common/FormField'
import { useGuest } from '../context/GuestContext'

const NAME_MAX_LENGTH = 60

/**
 * Primeiro contato de quem abre o app sem conta: só pede um nome (guardado localmente, sem cadastro)
 * e libera o app inteiro. Link secundário "Já tenho conta" cobre quem está num navegador novo e não
 * quer virar um guest novo.
 */
export function WelcomePage() {
  const { startGuest } = useGuest()
  const navigate = useNavigate()
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
    navigate('/timer')
  }

  return (
    <AuthLayout title="Boas-vindas">
      <p>Use o PomoGarden sem precisar criar conta. Seus dados ficam só neste navegador.</p>

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

      <Link to="/login" className={buttons.link}>
        Já tenho conta
      </Link>
    </AuthLayout>
  )
}
