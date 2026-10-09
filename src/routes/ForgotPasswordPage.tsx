import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { AuthLayout } from '../components/common/AuthLayout'
import { Banner } from '../components/common/Banner'
import { Button } from '../components/common/Button'
import { FormField } from '../components/common/FormField'
import { authService } from '../lib/authService'
import { ApiError } from '../types/api'

/**
 * Recuperação de senha sem e-mail/token (risco aceito, decisão de produto — ver README): um único
 * formulário nome+e-mail+nova senha+confirmação, enviado tudo junto; o backend só troca a senha se
 * nome e e-mail baterem com uma conta existente (`POST /api/auth/password-recovery`).
 */
export function ForgotPasswordPage() {
  const navigate = useNavigate()

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setFormError(null)

    if (newPassword !== confirmPassword) {
      setFieldErrors({ confirmPassword: 'As senhas não conferem.' })
      return
    }

    setFieldErrors({})
    setIsSubmitting(true)

    try {
      await authService.recoverPassword({ name, email, newPassword })
      navigate('/login', { state: { email, message: 'Senha redefinida. Faça login com a nova senha.' } })
    } catch (err) {
      if (err instanceof ApiError && err.status === 429) {
        // Rate limit (`RateLimitPolicies.PasswordRecovery`) — mensagem própria, não a do corpo da resposta.
        setFormError('Muitas tentativas. Tente novamente mais tarde.')
      } else if (err instanceof ApiError) {
        // 404 com mensagem genérica do backend — não revela se foi o nome ou o e-mail que não bateu.
        setFormError(err.message)
      } else {
        setFormError('Não foi possível redefinir sua senha. Tente novamente.')
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <AuthLayout title="Esqueci minha senha">
      {formError && <Banner kind="error" message={formError} />}

      <form onSubmit={handleSubmit} noValidate>
        <FormField
          label="Nome"
          name="name"
          autoComplete="name"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <FormField
          label="E-mail"
          name="email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <FormField
          label="Nova senha"
          name="newPassword"
          type="password"
          autoComplete="new-password"
          required
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
        />
        <FormField
          label="Confirmação da nova senha"
          name="confirmPassword"
          type="password"
          autoComplete="new-password"
          required
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          error={fieldErrors.confirmPassword}
        />
        <Button type="submit" fullWidth disabled={isSubmitting}>
          {isSubmitting ? 'Redefinindo…' : 'Redefinir senha'}
        </Button>
      </form>

      <Link to="/login" className="mt-4 block text-center [font:700_13px/18px_var(--font-sans)] text-primary-dark">
        Voltar para o login
      </Link>
    </AuthLayout>
  )
}
