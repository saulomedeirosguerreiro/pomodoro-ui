import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import buttons from '../components/common/buttons.module.css'
import { AuthLayout } from '../components/common/AuthLayout'
import { Banner } from '../components/common/Banner'
import { Button } from '../components/common/Button'
import { FormField } from '../components/common/FormField'
import { authService } from '../lib/authService'
import { ApiError } from '../types/api'

export function RegisterPage() {
  const navigate = useNavigate()

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setFormError(null)

    if (password !== confirmPassword) {
      setFieldErrors({ confirmPassword: 'As senhas não conferem.' })
      return
    }

    setFieldErrors({})
    setIsSubmitting(true)

    try {
      await authService.register({ name, email, password })
      navigate('/login', { state: { email, message: 'Conta criada com sucesso! Faça login.' } })
    } catch (err) {
      if (err instanceof ApiError) {
        setFormError(err.message)
        setFieldErrors({
          name: err.fieldMessage('Name') ?? '',
          email: err.fieldMessage('Email') ?? '',
          password: err.fieldMessage('Password') ?? '',
        })
      } else {
        setFormError('Não foi possível criar a conta. Tente novamente.')
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <AuthLayout title="Criar conta">
      {formError && <Banner kind="error" message={formError} />}

      <form onSubmit={handleSubmit} noValidate>
        <FormField
          label="Nome"
          name="name"
          autoComplete="name"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          error={fieldErrors.name}
        />
        <FormField
          label="E-mail"
          name="email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          error={fieldErrors.email}
        />
        <FormField
          label="Senha"
          name="password"
          type="password"
          autoComplete="new-password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          error={fieldErrors.password}
        />
        <FormField
          label="Confirmação de senha"
          name="confirmPassword"
          type="password"
          autoComplete="new-password"
          required
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          error={fieldErrors.confirmPassword}
        />
        <Button type="submit" fullWidth disabled={isSubmitting}>
          {isSubmitting ? 'Criando…' : 'Cadastrar'}
        </Button>
      </form>

      <Link to="/login" className={buttons.link}>
        Já tenho conta
      </Link>
    </AuthLayout>
  )
}
