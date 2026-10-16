import { useState, type FormEvent } from 'react'
import { Trans, useTranslation } from 'react-i18next'
import { Link, useNavigate } from 'react-router-dom'
import { Button } from '../components/common/Button'
import { Checkbox } from '../components/common/Checkbox'
import { Dialog } from '../components/common/Dialog'
import { FormField } from '../components/common/FormField'
import { LanguageSwitcher } from '../components/common/LanguageSwitcher'
import { ThemeToggle } from '../components/common/ThemeToggle'
import { useAuth } from '../context/AuthContext'
import { useDataSource } from '../context/DataSourceContext'
import { useGuest } from '../context/GuestContext'
import { useSettings } from '../context/SettingsContext'
import { DEFAULT_SETTINGS, type Settings } from '../lib/settings'
import { getNotificationPermission, requestNotificationPermission } from '../lib/notifications'
import { usersService } from '../lib/usersService'
import { ApiError } from '../types/api'

const CARD_CLASSES = 'flex flex-col gap-2 rounded-2xl border border-border bg-surface p-4 shadow-card'
const DANGER_CARD_CLASSES = `${CARD_CLASSES} border-danger`
const DANGER_BUTTON_CLASSES = 'self-start border-danger! text-danger!'

interface DurationFieldConfig {
  key: 'focusMinutes' | 'shortBreakMinutes' | 'longBreakMinutes'
  labelKey: string
  min: number
  max: number
}

const DURATION_FIELDS: DurationFieldConfig[] = [
  { key: 'focusMinutes', labelKey: 'durations.focusMinutes', min: 5, max: 120 },
  { key: 'shortBreakMinutes', labelKey: 'durations.shortBreakMinutes', min: 1, max: 30 },
  { key: 'longBreakMinutes', labelKey: 'durations.longBreakMinutes', min: 5, max: 60 },
]

function clampDuration(raw: string, fallback: number, min: number, max: number): number {
  const parsed = Number.parseInt(raw, 10)
  if (!Number.isFinite(parsed)) {
    return fallback
  }
  return Math.min(max, Math.max(min, parsed))
}

export function ConfiguracoesPage() {
  const { t } = useTranslation('settings')
  const { settings, updateSettings } = useSettings()
  const { logout } = useAuth()
  const { mode } = useDataSource()
  const { clearGuestData } = useGuest()
  const navigate = useNavigate()
  const [permission, setPermission] = useState(getNotificationPermission())

  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false)
  const [deletePassword, setDeletePassword] = useState('')
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const [durationInputs, setDurationInputs] = useState<Record<DurationFieldConfig['key'], string>>({
    focusMinutes: String(settings.focusMinutes),
    shortBreakMinutes: String(settings.shortBreakMinutes),
    longBreakMinutes: String(settings.longBreakMinutes),
  })

  function handleDurationBlur(field: DurationFieldConfig) {
    const clamped = clampDuration(durationInputs[field.key], settings[field.key], field.min, field.max)
    setDurationInputs((prev) => ({ ...prev, [field.key]: String(clamped) }))
    updateSettings({ [field.key]: clamped } as Partial<Settings>)
  }

  function handleRestoreDefaults() {
    const defaults = {
      focusMinutes: DEFAULT_SETTINGS.focusMinutes,
      shortBreakMinutes: DEFAULT_SETTINGS.shortBreakMinutes,
      longBreakMinutes: DEFAULT_SETTINGS.longBreakMinutes,
    }
    setDurationInputs({
      focusMinutes: String(defaults.focusMinutes),
      shortBreakMinutes: String(defaults.shortBreakMinutes),
      longBreakMinutes: String(defaults.longBreakMinutes),
    })
    updateSettings(defaults)
  }

  async function handleRequestPermission() {
    const result = await requestNotificationPermission()
    setPermission(result)
    if (result === 'granted') {
      updateSettings({ notificationsEnabled: true })
    }
  }

  async function handleDeleteAccount(event: FormEvent) {
    event.preventDefault()
    setDeleteError(null)
    setIsDeleting(true)
    try {
      await usersService.deleteAccount(deletePassword)
      logout()
      // Mesmo fluxo do "Sair" (AppShell.tsx): limpa guest residual e volta pro /timer, que mostra o
      // WelcomeModal sozinho sem user nem guest — em vez de forçar especificamente a tela de login.
      clearGuestData()
      navigate('/timer', { replace: true })
    } catch (err) {
      setDeleteError(err instanceof ApiError ? err.message : t('deleteAccount.genericError'))
    } finally {
      setIsDeleting(false)
    }
  }

  /** Guest não tem senha nem servidor para confirmar — só uma confirmação local antes de limpar o
   *  storage. Sem `guest`, `ProtectedRoute` mostra o modal de boas-vindas por cima de `/timer`. */
  function handleWipeGuestData() {
    clearGuestData()
    navigate('/timer')
  }

  return (
    <div className="mx-auto flex max-w-[640px] flex-col gap-4">
      <div>
        <h1>{t('page.title')}</h1>
        <p className="text-style-body-sm text-text-muted">{t('page.subtitle')}</p>
      </div>

      <section className={CARD_CLASSES}>
        <h2 className="flex items-center gap-2 text-style-headline-sm">
          <span aria-hidden="true">⏱️</span> {t('durations.heading')}
        </h2>
        {DURATION_FIELDS.map((field) => (
          <FormField
            key={field.key}
            label={t(field.labelKey)}
            name={field.key}
            type="number"
            min={field.min}
            max={field.max}
            step={1}
            value={durationInputs[field.key]}
            onChange={(e) => setDurationInputs((prev) => ({ ...prev, [field.key]: e.target.value }))}
            onBlur={() => handleDurationBlur(field)}
          />
        ))}
        <Button variant="secondary" className="self-start" onClick={handleRestoreDefaults}>
          {t('durations.restoreDefaults')}
        </Button>
      </section>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <section className={CARD_CLASSES}>
          <h2 className="flex items-center gap-2 text-style-headline-sm">
            <span aria-hidden="true">🔔</span> {t('notifications.heading')}
          </h2>
          {permission === 'unsupported' && (
            <p className="text-style-body-sm text-text-muted">{t('notifications.unsupported')}</p>
          )}
          {permission === 'default' && (
            <Button variant="secondary" onClick={handleRequestPermission}>
              {t('notifications.enable')}
            </Button>
          )}
          {permission === 'denied' && (
            <p className="text-style-body-sm text-text-muted">{t('notifications.denied')}</p>
          )}
          {permission === 'granted' && (
            <Checkbox
              checked={settings.notificationsEnabled}
              onChange={(checked) => updateSettings({ notificationsEnabled: checked })}
              label={t('notifications.granted')}
            />
          )}
        </section>

        <section className={CARD_CLASSES}>
          <h2 className="flex items-center gap-2 text-style-headline-sm">
            <span aria-hidden="true">🍅</span> {t('mascot.heading')}
          </h2>
          <Checkbox
            checked={settings.mascotSpeechEnabled}
            onChange={(checked) => updateSettings({ mascotSpeechEnabled: checked })}
            label={t('mascot.speech')}
          />
        </section>

        <section className={CARD_CLASSES}>
          <h2 className="flex items-center gap-2 text-style-headline-sm">
            <span aria-hidden="true">♿</span> {t('accessibility.heading')}
          </h2>
          <Checkbox
            checked={settings.reduceAnimations}
            onChange={(checked) => updateSettings({ reduceAnimations: checked })}
            label={t('accessibility.reduceAnimations')}
          />
        </section>

        <section className={CARD_CLASSES}>
          <h2 className="flex items-center gap-2 text-style-headline-sm">
            <span aria-hidden="true">🎧</span> {t('sound.heading')}
          </h2>
          <Checkbox
            checked={settings.sessionEndSoundEnabled}
            onChange={(checked) => updateSettings({ sessionEndSoundEnabled: checked })}
            label={t('sound.sessionEndSound')}
          />
        </section>
      </div>

      <section className={CARD_CLASSES}>
        <h2 className="flex items-center gap-2 text-style-headline-sm">
          <span aria-hidden="true">🎨</span> {t('appearance.heading')}
        </h2>
        <p className="text-style-body-sm text-text-muted">{t('appearance.description')}</p>
        <ThemeToggle />
        <div className="flex items-center gap-2">
          <span className="text-style-label-md text-text-muted">{t('appearance.languageLabel')}</span>
          <LanguageSwitcher />
        </div>
      </section>

      <section className={CARD_CLASSES}>
        <h2 className="flex items-center gap-2 text-style-headline-sm">
          <span aria-hidden="true">❓</span> {t('helpAndLegal.heading')}
        </h2>
        <div className="flex flex-col gap-1">
          <Link to="/ajuda" className="text-style-body-md text-primary-dark no-underline hover:underline">
            {t('helpAndLegal.help')}
          </Link>
          <Link to="/termos-de-uso" className="text-style-body-md text-primary-dark no-underline hover:underline">
            {t('helpAndLegal.terms')}
          </Link>
          <Link to="/privacidade" className="text-style-body-md text-primary-dark no-underline hover:underline">
            {t('helpAndLegal.privacy')}
          </Link>
        </div>
      </section>

      <section className={CARD_CLASSES}>
        <h2 className="flex items-center gap-2 text-style-headline-sm">
          <span aria-hidden="true">🔒</span> {t('privacy.heading')}
        </h2>
        <Checkbox
          checked={settings.analyticsEnabled}
          onChange={(checked) => updateSettings({ analyticsEnabled: checked })}
          label={t('privacy.analytics')}
        />
        <p className="text-style-body-sm text-text-muted">
          <Trans
            t={t}
            i18nKey="privacy.analyticsDescription"
            components={[
              <Link key="0" to="/privacidade" target="_blank" rel="noopener noreferrer" className="text-primary-dark" />,
            ]}
          />
        </p>
      </section>

      {mode === 'guest' ? (
        <section className={DANGER_CARD_CLASSES}>
          <h2 className="flex items-center gap-2 text-style-headline-sm">
            <span aria-hidden="true">⚠️</span> {t('wipeGuestData.heading')}
          </h2>
          <p className="text-style-body-sm text-text-muted">{t('wipeGuestData.description')}</p>

          <Button variant="ghost" className={DANGER_BUTTON_CLASSES} onClick={() => setIsConfirmingDelete(true)}>
            {t('wipeGuestData.button')}
          </Button>

          {isConfirmingDelete && (
            <Dialog titleText={t('wipeGuestData.confirmTitle')} onDismiss={() => setIsConfirmingDelete(false)}>
              <p className="text-style-body-sm text-text-muted">{t('wipeGuestData.confirmBody')}</p>
              <div className="flex justify-end gap-2">
                <Button variant="ghost" onClick={() => setIsConfirmingDelete(false)}>
                  {t('common:cancel')}
                </Button>
                <Button className={DANGER_BUTTON_CLASSES} onClick={handleWipeGuestData}>
                  {t('wipeGuestData.confirmButton')}
                </Button>
              </div>
            </Dialog>
          )}
        </section>
      ) : (
        <section className={DANGER_CARD_CLASSES}>
          <h2 className="flex items-center gap-2 text-style-headline-sm">
            <span aria-hidden="true">⚠️</span> {t('deleteAccount.heading')}
          </h2>
          <p className="text-style-body-sm text-text-muted">{t('deleteAccount.description')}</p>

          {!isConfirmingDelete ? (
            <Button variant="ghost" className={DANGER_BUTTON_CLASSES} onClick={() => setIsConfirmingDelete(true)}>
              {t('deleteAccount.button')}
            </Button>
          ) : (
            <form className="flex flex-col gap-2" onSubmit={handleDeleteAccount} noValidate>
              {deleteError && (
                <p className="text-style-body-sm text-danger" role="alert">
                  {deleteError}
                </p>
              )}
              <FormField
                label={t('deleteAccount.passwordLabel')}
                name="deletePassword"
                type="password"
                autoComplete="current-password"
                required
                value={deletePassword}
                onChange={(e) => setDeletePassword(e.target.value)}
              />
              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => {
                    setIsConfirmingDelete(false)
                    setDeletePassword('')
                    setDeleteError(null)
                  }}
                >
                  {t('common:cancel')}
                </Button>
                <Button type="submit" className={DANGER_BUTTON_CLASSES} disabled={isDeleting}>
                  {isDeleting ? t('deleteAccount.submitting') : t('deleteAccount.submit')}
                </Button>
              </div>
            </form>
          )}
        </section>
      )}
    </div>
  )
}
