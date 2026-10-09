import { useEffect, useState, type FormEvent } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { AuthLayout } from '../components/common/AuthLayout'
import { Banner } from '../components/common/Banner'
import { Button } from '../components/common/Button'
import { FormField } from '../components/common/FormField'
import { MigrationDialog } from '../components/migration/MigrationDialog'
import { MigrationReport } from '../components/migration/MigrationReport'
import { useAuth } from '../context/AuthContext'
import { usePostLoginMigration } from '../hooks/usePostLoginMigration'
import { ApiError } from '../types/api'

interface LocationState {
  message?: string
  email?: string
}

export function LoginPage() {
  const { login, acknowledgeSessionExpired } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const state = (location.state as LocationState | null) ?? null

  const [email, setEmail] = useState(state?.email ?? '')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [successMessage] = useState(state?.message)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // US-82: se chegamos aqui por sessão de conta expirada (ProtectedRoute), limpa a flag assim que a
  // tela monta — evita que um login bem-sucedido logo depois seja tratado como "ainda expirada".
  useEffect(() => {
    acknowledgeSessionExpired()
  }, [acknowledgeSessionExpired])

  // US-85/D9: login em conta JÁ EXISTENTE com dados locais pendentes pergunta via diálogo de 3 opções
  // antes de navegar (diferente do cadastro, que importa automático — ver RegisterPage).
  const migration = usePostLoginMigration(() => navigate('/timer'))

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setError(null)
    setIsSubmitting(true)

    try {
      await login(email, password)
      migration.offerIfNeeded()
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message)
      } else {
        setError('Não foi possível entrar. Tente novamente.')
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <AuthLayout title="Entrar">
      {successMessage && <Banner kind="success" message={successMessage} />}
      {error && <Banner kind="error" message={error} />}
      {migration.state.phase === 'error' && <Banner kind="error" message={migration.state.message} />}

      <form onSubmit={handleSubmit} noValidate>
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
          label="Senha"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <Button type="submit" fullWidth disabled={isSubmitting}>
          {isSubmitting ? 'Entrando…' : 'Entrar'}
        </Button>
      </form>

      <Link
        to="/esqueci-minha-senha"
        className="mt-4 block text-center [font:700_13px/18px_var(--font-sans)] text-primary-dark"
      >
        Esqueci minha senha
      </Link>
      <Link to="/cadastro" className="mt-4 block text-center [font:700_13px/18px_var(--font-sans)] text-primary-dark">
        Criar conta
      </Link>

      {(migration.state.phase === 'asking' || migration.state.phase === 'importing') && (
        <MigrationDialog
          isImporting={migration.state.phase === 'importing'}
          onImport={migration.chooseImport}
          onDiscard={migration.chooseDiscard}
          onLater={migration.chooseLater}
        />
      )}

      {migration.state.phase === 'report' && (
        <MigrationReport result={migration.state.result} onDismiss={migration.dismissReport} />
      )}
    </AuthLayout>
  )
}
