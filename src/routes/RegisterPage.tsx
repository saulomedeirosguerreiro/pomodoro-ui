import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { AuthLayout } from '../components/common/AuthLayout'
import { Banner } from '../components/common/Banner'
import { Button } from '../components/common/Button'
import { FormField } from '../components/common/FormField'
import { MigrationReport } from '../components/migration/MigrationReport'
import { useAuth } from '../context/AuthContext'
import { useGuest } from '../context/GuestContext'
import { authService } from '../lib/authService'
import { hasAnyLocalGuestData } from '../lib/localDataWipe'
import { buildImportRequestFromLocalData, migrationService, type ImportGuestDataResponse } from '../lib/migrationService'
import { tokenStorage } from '../lib/tokenStorage'
import { ApiError } from '../types/api'

export function RegisterPage() {
  const navigate = useNavigate()
  const { guest, clearGuestData } = useGuest()
  const { refreshProfile } = useAuth()

  const [name, setName] = useState(guest?.name ?? '')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [migrationReport, setMigrationReport] = useState<ImportGuestDataResponse | null>(null)

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
      setIsSubmitting(false)
      return
    }

    if (!hasAnyLocalGuestData()) {
      navigate('/login', { state: { email, message: 'Conta criada com sucesso! Faça login.' } })
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
          message: 'Conta criada, mas não foi possível importar seus dados locais agora. Entre para tentar novamente.',
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

      <Link to="/login" className="mt-4 block text-center [font:700_13px/18px_var(--font-sans)] text-primary-dark">
        Já tenho conta
      </Link>

      {migrationReport && <MigrationReport result={migrationReport} onDismiss={handleDismissReport} />}
    </AuthLayout>
  )
}
