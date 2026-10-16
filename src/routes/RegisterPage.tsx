import { useState, type FormEvent } from 'react'
import { Trans, useTranslation } from 'react-i18next'
import { Link, useNavigate } from 'react-router-dom'
import { AuthLayout } from '../components/common/AuthLayout'
import { Banner } from '../components/common/Banner'
import { Button } from '../components/common/Button'
import { Checkbox } from '../components/common/Checkbox'
import { FormField } from '../components/common/FormField'
import { MigrationReport } from '../components/migration/MigrationReport'
import { useAuth } from '../context/AuthContext'
import { useGuest } from '../context/GuestContext'
import { trackEvent } from '../lib/analytics'
import { apiErrorMessage } from '../lib/apiClient'
import { authService } from '../lib/authService'
import { hasAnyLocalGuestData } from '../lib/localDataWipe'
import { buildImportRequestFromLocalData, migrationService, type ImportGuestDataResponse } from '../lib/migrationService'
import { tokenStorage } from '../lib/tokenStorage'
import { ApiError } from '../types/api'

export function RegisterPage() {
  const { t } = useTranslation('auth')
  const navigate = useNavigate()
  const { guest, clearGuestData } = useGuest()
  const { login, refreshProfile } = useAuth()

  const [name, setName] = useState(guest?.name ?? '')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [acceptedTerms, setAcceptedTerms] = useState(false)

  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [migrationReport, setMigrationReport] = useState<ImportGuestDataResponse | null>(null)

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setFormError(null)

    if (password !== confirmPassword) {
      setFieldErrors({ confirmPassword: t('register.passwordMismatch') })
      return
    }

    if (!acceptedTerms) {
      setFieldErrors({ acceptedTerms: t('register.termsRequired') })
      return
    }

    setFieldErrors({})
    setIsSubmitting(true)

    try {
      await authService.register({ name, email, password, acceptedTerms })
    } catch (err) {
      if (err instanceof ApiError) {
        setFormError(apiErrorMessage(t, err))
        setFieldErrors({
          name: err.fieldMessage('Name') ?? '',
          email: err.fieldMessage('Email') ?? '',
          password: err.fieldMessage('Password') ?? '',
          acceptedTerms: err.fieldMessage('AcceptedTerms') ?? '',
        })
      } else {
        setFormError(t('register.genericError'))
      }
      setIsSubmitting(false)
      return
    }

    trackEvent('sign_up')

    if (!hasAnyLocalGuestData()) {
      try {
        await login(email, password)
        navigate('/timer', { replace: true })
      } catch {
        navigate('/login', {
          state: {
            email,
            message: t('register.autoLoginFailed'),
          },
        })
      } finally {
        setIsSubmitting(false)
      }
      return
    }

    // D9/US-84: conta nova importa os dados locais automaticamente, sem diálogo (nada preexistente na
    // conta nova para conflitar). A importação exige um token (`POST /api/migration/import` é
    // autenticado) e `authService.register` não devolve um — por isso loga antes de importar, gravando
    // o token diretamente (sem passar por `useAuth().login`, que já popularia `user` e levaria
    // `PublicOnlyRoute` a navegar para fora desta página no meio da importação).
    try {
      const { token } = await authService.login({ email, password })
      tokenStorage.set(token)

      const request = buildImportRequestFromLocalData(guest?.id ?? '')
      const result = await migrationService.importLocalData(request)
      clearGuestData()

      if (result.skipped.length > 0) {
        setMigrationReport(result)
      } else {
        await refreshProfile()
        navigate('/timer', { replace: true })
      }
    } catch {
      tokenStorage.clear()
      navigate('/login', {
        state: {
          email,
          message: t('register.importFailed'),
        },
      })
      return
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleDismissReport() {
    setMigrationReport(null)
    await refreshProfile()
    navigate('/timer', { replace: true })
  }

  return (
    <AuthLayout title={t('register.title')}>
      {formError && <Banner kind="error" message={formError} />}

      <form onSubmit={handleSubmit} noValidate>
        <FormField
          label={t('register.nameLabel')}
          name="name"
          autoComplete="name"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          error={fieldErrors.name}
        />
        <FormField
          label={t('register.emailLabel')}
          name="email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          error={fieldErrors.email}
        />
        <FormField
          label={t('register.passwordLabel')}
          name="password"
          type="password"
          autoComplete="new-password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          error={fieldErrors.password}
        />
        <FormField
          label={t('register.confirmPasswordLabel')}
          name="confirmPassword"
          type="password"
          autoComplete="new-password"
          required
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          error={fieldErrors.confirmPassword}
        />
        <div className="mb-4 flex flex-col gap-1">
          <Checkbox
            id="acceptedTerms"
            checked={acceptedTerms}
            onChange={setAcceptedTerms}
            label={
              <Trans
                t={t}
                i18nKey="register.acceptTerms"
                components={{
                  termsLink: (
                    <Link to="/termos-de-uso" target="_blank" rel="noopener noreferrer" className="text-primary-dark" />
                  ),
                  privacyLink: (
                    <Link to="/privacidade" target="_blank" rel="noopener noreferrer" className="text-primary-dark" />
                  ),
                }}
              />
            }
          />
          {fieldErrors.acceptedTerms && (
            <p className="text-style-body-sm text-danger" role="alert">
              {fieldErrors.acceptedTerms}
            </p>
          )}
        </div>

        <Button type="submit" fullWidth disabled={isSubmitting || !acceptedTerms}>
          {isSubmitting ? t('register.submitting') : t('register.submit')}
        </Button>
      </form>

      <Link to="/login" className="mt-4 block text-center [font:700_13px/18px_var(--font-sans)] text-primary-dark">
        {t('register.alreadyHaveAccount')}
      </Link>

      {migrationReport && <MigrationReport result={migrationReport} onDismiss={handleDismissReport} />}
    </AuthLayout>
  )
}
