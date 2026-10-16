import { useEffect, useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { Badge } from '../components/common/Badge'
import { Banner } from '../components/common/Banner'
import { Button } from '../components/common/Button'
import { FormField } from '../components/common/FormField'
import { LevelProgressSkeleton } from '../components/common/LevelProgressSkeleton'
import { ProgressBar } from '../components/common/ProgressBar'
import { Skeleton } from '../components/common/Skeleton'
import { useAuth } from '../context/AuthContext'
import { useTimerContext } from '../context/TimerContext'
import { apiErrorMessage } from '../lib/apiClient'
import { levelTitleLabel, streakLabel } from '../lib/format'
import { usersService } from '../lib/usersService'
import { ApiError } from '../types/api'

const CARD_CLASSES = 'flex flex-col gap-2 rounded-2xl border border-border bg-surface p-4 shadow-card'

/** Só faz sentido pra quem tem conta (nome só é persistido no servidor, senha só existe pra quem
 *  não é guest) — um guest que chegue aqui direto pela URL é mandado de volta pro timer. */
export function PerfilPage() {
  const { t } = useTranslation('settings')
  const { user, refreshProfile } = useAuth()
  const { progress } = useTimerContext()
  const navigate = useNavigate()

  const [name, setName] = useState(user?.name ?? '')
  const [nameError, setNameError] = useState<string | null>(null)
  const [nameSuccess, setNameSuccess] = useState<string | null>(null)
  const [isSavingName, setIsSavingName] = useState(false)

  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordFieldErrors, setPasswordFieldErrors] = useState<Record<string, string>>({})
  const [passwordError, setPasswordError] = useState<string | null>(null)
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null)
  const [isSavingPassword, setIsSavingPassword] = useState(false)

  useEffect(() => {
    if (!user) {
      navigate('/timer', { replace: true })
    }
  }, [user, navigate])

  useEffect(() => {
    setName(user?.name ?? '')
  }, [user?.name])

  async function handleSaveName(event: FormEvent) {
    event.preventDefault()
    setNameError(null)
    setNameSuccess(null)
    setIsSavingName(true)

    try {
      await usersService.updateName(name)
      await refreshProfile()
      setNameSuccess(t('profile.editName.success'))
    } catch (err) {
      setNameError(err instanceof ApiError ? apiErrorMessage(t, err) : t('profile.editName.genericError'))
    } finally {
      setIsSavingName(false)
    }
  }

  async function handleSavePassword(event: FormEvent) {
    event.preventDefault()
    setPasswordError(null)
    setPasswordSuccess(null)

    if (newPassword !== confirmPassword) {
      setPasswordFieldErrors({ confirmPassword: t('profile.changePassword.mismatchError') })
      return
    }

    setPasswordFieldErrors({})
    setIsSavingPassword(true)

    try {
      await usersService.changePassword(currentPassword, newPassword)
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
      setPasswordSuccess(t('profile.changePassword.success'))
    } catch (err) {
      if (err instanceof ApiError) {
        setPasswordError(apiErrorMessage(t, err))
        setPasswordFieldErrors({
          currentPassword: err.fieldMessage('CurrentPassword') ?? '',
          newPassword: err.fieldMessage('NewPassword') ?? '',
        })
      } else {
        setPasswordError(t('profile.changePassword.genericError'))
      }
    } finally {
      setIsSavingPassword(false)
    }
  }

  if (!user) {
    return null
  }

  const firstName = user.name.trim().split(/\s+/)[0] ?? user.name

  return (
    <div className="mx-auto flex max-w-[640px] flex-col gap-4">
      <div>
        <h1>{t('profile.title')}</h1>
        <p className="text-style-body-sm text-text-muted">{t('profile.subtitle')}</p>
      </div>

      <section className={CARD_CLASSES}>
        <div className="flex items-center gap-3">
          <div
            className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-tertiary text-style-headline-sm text-on-primary"
            aria-hidden="true"
          >
            {firstName.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <p className="overflow-hidden text-ellipsis whitespace-nowrap text-style-headline-sm text-text-h">
              {user.name}
            </p>
            <p className="overflow-hidden text-ellipsis whitespace-nowrap text-style-body-sm text-text-muted">
              {user.email}
            </p>
          </div>
        </div>

        {progress ? (
          <div className="flex flex-col gap-2 border-t border-border pt-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-style-label-sm text-primary-dark">
                {t('common:level', { level: progress.level, title: levelTitleLabel(t, progress.title) })}
              </p>
              <Badge variant={progress.streakDays > 0 ? 'highlight' : 'neutral'}>
                🔥 {streakLabel(t, progress.streakDays)}
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex-1">
                <ProgressBar value={progress.xpInLevel} max={progress.xpForNextLevel} />
              </div>
              <span className="whitespace-nowrap text-style-label-sm text-text-muted">
                {progress.xpInLevel}/{progress.xpForNextLevel} XP
              </span>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-2 border-t border-border pt-3" role="status" aria-live="polite" aria-busy="true">
            <span className="sr-only">{t('profile.loadingProgress')}</span>
            <div className="flex items-center justify-between gap-2">
              <Skeleton variant="text" className="w-40" />
              <Skeleton variant="rect" className="h-5 w-20 rounded-full" />
            </div>
            <LevelProgressSkeleton />
          </div>
        )}
      </section>

      <section className={CARD_CLASSES}>
        <h2 className="flex items-center gap-2 text-style-headline-sm">
          <span aria-hidden="true">✏️</span> {t('profile.editName.heading')}
        </h2>
        <form className="flex flex-col gap-2" onSubmit={handleSaveName} noValidate>
          {nameSuccess && <Banner kind="success" message={nameSuccess} />}
          {nameError && <Banner kind="error" message={nameError} />}
          <FormField
            label={t('profile.editName.label')}
            name="name"
            autoComplete="name"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <Button type="submit" className="self-start" disabled={isSavingName}>
            {isSavingName ? t('profile.editName.saving') : t('profile.editName.save')}
          </Button>
        </form>
      </section>

      <section className={CARD_CLASSES}>
        <h2 className="flex items-center gap-2 text-style-headline-sm">
          <span aria-hidden="true">🔑</span> {t('profile.changePassword.heading')}
        </h2>
        <form className="flex flex-col gap-2" onSubmit={handleSavePassword} noValidate>
          {passwordSuccess && <Banner kind="success" message={passwordSuccess} />}
          {passwordError && <Banner kind="error" message={passwordError} />}
          <FormField
            label={t('profile.changePassword.currentPasswordLabel')}
            name="currentPassword"
            type="password"
            autoComplete="current-password"
            required
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            error={passwordFieldErrors.currentPassword}
          />
          <FormField
            label={t('profile.changePassword.newPasswordLabel')}
            name="newPassword"
            type="password"
            autoComplete="new-password"
            required
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            error={passwordFieldErrors.newPassword}
          />
          <FormField
            label={t('profile.changePassword.confirmPasswordLabel')}
            name="confirmPassword"
            type="password"
            autoComplete="new-password"
            required
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            error={passwordFieldErrors.confirmPassword}
          />
          <Button type="submit" className="self-start" disabled={isSavingPassword}>
            {isSavingPassword ? t('profile.changePassword.saving') : t('profile.changePassword.save')}
          </Button>
        </form>
      </section>
    </div>
  )
}
