import { useEffect, useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { AuthLayout } from '../components/common/AuthLayout'
import { Banner } from '../components/common/Banner'
import { Button } from '../components/common/Button'
import { FormField } from '../components/common/FormField'
import { MigrationDialog } from '../components/migration/MigrationDialog'
import { MigrationReport } from '../components/migration/MigrationReport'
import { useAuth } from '../context/AuthContext'
import { usePostLoginMigration } from '../hooks/usePostLoginMigration'
import { apiErrorMessage } from '../lib/apiClient'
import { ApiError } from '../types/api'

interface LocationState {
  message?: string
  email?: string
}

export function LoginPage() {
  const { t } = useTranslation('auth')
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
        setError(apiErrorMessage(t, err))
      } else {
        setError(t('login.genericError'))
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <AuthLayout title={t('login.title')}>
      {successMessage && <Banner kind="success" message={successMessage} />}
      {error && <Banner kind="error" message={error} />}
      {migration.state.phase === 'error' && <Banner kind="error" message={migration.state.message} />}

      <form onSubmit={handleSubmit} noValidate>
        <FormField
          label={t('login.emailLabel')}
          name="email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <FormField
          label={t('login.passwordLabel')}
          name="password"
          type="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <Link
          to="/esqueci-minha-senha"
          className="-mt-2 mb-4 block text-right text-style-body-sm text-text-muted hover:text-primary-dark"
        >
          {t('login.forgotPassword')}
        </Link>
        <Button type="submit" fullWidth disabled={isSubmitting}>
          {isSubmitting ? t('login.submitting') : t('login.submit')}
        </Button>
      </form>

      <div className="mt-6 flex items-center gap-3 text-style-body-sm text-text-muted">
        <span className="h-px flex-1 bg-border" />
        {t('login.newHere')}
        <span className="h-px flex-1 bg-border" />
      </div>

      <Link
        to="/cadastro"
        className="mt-4 inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-full border-2 border-border bg-bg-subtle px-6 py-3 text-style-label-lg text-text-h transition-[transform,box-shadow] duration-150 ease-out active:translate-y-0.5"
      >
        {t('login.createAccount')}
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
