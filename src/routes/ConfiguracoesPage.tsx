import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '../components/common/Button'
import { Checkbox } from '../components/common/Checkbox'
import { Dialog } from '../components/common/Dialog'
import { FormField } from '../components/common/FormField'
import { ThemeToggle } from '../components/common/ThemeToggle'
import { useAuth } from '../context/AuthContext'
import { useDataSource } from '../context/DataSourceContext'
import { useGuest } from '../context/GuestContext'
import { useSettings } from '../context/SettingsContext'
import { getNotificationPermission, requestNotificationPermission } from '../lib/notifications'
import { usersService } from '../lib/usersService'
import { ApiError } from '../types/api'

const CARD_CLASSES = 'flex flex-col gap-2 rounded-2xl border border-border bg-surface p-4 shadow-card'
const DANGER_CARD_CLASSES = `${CARD_CLASSES} border-danger`
const DANGER_BUTTON_CLASSES = 'self-start border-danger! text-danger!'

export function ConfiguracoesPage() {
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
      navigate('/login')
    } catch (err) {
      setDeleteError(err instanceof ApiError ? err.message : 'Não foi possível excluir a conta. Tente novamente.')
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
      <h1>Configurações</h1>

      <section className={CARD_CLASSES}>
        <h2 className="text-style-headline-sm">Notificações</h2>
        {permission === 'unsupported' && (
          <p className="text-style-body-sm text-text-muted">Seu navegador não suporta notificações.</p>
        )}
        {permission === 'default' && (
          <Button variant="secondary" onClick={handleRequestPermission}>
            Ativar notificações do navegador
          </Button>
        )}
        {permission === 'denied' && (
          <p className="text-style-body-sm text-text-muted">
            As notificações foram bloqueadas nas configurações do navegador. Para ativar, permita-as manualmente nas
            permissões do site.
          </p>
        )}
        {permission === 'granted' && (
          <Checkbox
            checked={settings.notificationsEnabled}
            onChange={(checked) => updateSettings({ notificationsEnabled: checked })}
            label="Avisar quando uma sessão terminar (com a aba em segundo plano)"
          />
        )}
      </section>

      <section className={CARD_CLASSES}>
        <h2 className="text-style-headline-sm">Mascote</h2>
        <Checkbox
          checked={settings.mascotSpeechEnabled}
          onChange={(checked) => updateSettings({ mascotSpeechEnabled: checked })}
          label="Falas do Tomatinho"
        />
      </section>

      <section className={CARD_CLASSES}>
        <h2 className="text-style-headline-sm">Acessibilidade</h2>
        <Checkbox
          checked={settings.reduceAnimations}
          onChange={(checked) => updateSettings({ reduceAnimations: checked })}
          label="Reduzir animações"
        />
      </section>

      <section className={CARD_CLASSES}>
        <h2 className="text-style-headline-sm">Aparência</h2>
        <p className="text-style-body-sm text-text-muted">Escolha entre o tema claro e escuro.</p>
        <ThemeToggle />
      </section>

      <section className={CARD_CLASSES}>
        <h2 className="text-style-headline-sm">Som</h2>
        <Checkbox
          checked={settings.sessionEndSoundEnabled}
          onChange={(checked) => updateSettings({ sessionEndSoundEnabled: checked })}
          label="Som ao final da sessão"
        />
        <p className="text-style-body-sm text-text-muted">
          Ainda sem arquivo de áudio nesta versão — a preferência já fica pronta para quando ele chegar.
        </p>
      </section>

      {mode === 'guest' ? (
        <section className={DANGER_CARD_CLASSES}>
          <h2 className="text-style-headline-sm">Apagar meus dados deste dispositivo</h2>
          <p className="text-style-body-sm text-text-muted">
            Você está usando o PomoGarden sem conta: tarefas, sessões e conquistas ficam salvas só neste navegador.
            Apagar os dados deste dispositivo os remove para sempre — não há como recuperá-los depois.
          </p>

          <Button variant="ghost" className={DANGER_BUTTON_CLASSES} onClick={() => setIsConfirmingDelete(true)}>
            Apagar meus dados deste dispositivo
          </Button>

          {isConfirmingDelete && (
            <Dialog titleText="Apagar todos os dados deste dispositivo?" onDismiss={() => setIsConfirmingDelete(false)}>
              <p className="text-style-body-sm text-text-muted">
                Essa ação não pode ser desfeita. Tarefas, sessões e conquistas salvas neste navegador serão apagadas
                permanentemente.
              </p>
              <div className="flex justify-end gap-2">
                <Button variant="ghost" onClick={() => setIsConfirmingDelete(false)}>
                  Cancelar
                </Button>
                <Button className={DANGER_BUTTON_CLASSES} onClick={handleWipeGuestData}>
                  Apagar definitivamente
                </Button>
              </div>
            </Dialog>
          )}
        </section>
      ) : (
        <section className={DANGER_CARD_CLASSES}>
          <h2 className="text-style-headline-sm">Excluir conta</h2>
          <p className="text-style-body-sm text-text-muted">
            Remove sua conta e todo o histórico (sessões, tarefas, conquistas) para sempre. Essa ação não pode
            ser desfeita.
          </p>

          {!isConfirmingDelete ? (
            <Button variant="ghost" className={DANGER_BUTTON_CLASSES} onClick={() => setIsConfirmingDelete(true)}>
              Excluir minha conta
            </Button>
          ) : (
            <form className="flex flex-col gap-2" onSubmit={handleDeleteAccount} noValidate>
              {deleteError && (
                <p className="text-style-body-sm text-danger" role="alert">
                  {deleteError}
                </p>
              )}
              <FormField
                label="Confirme sua senha para excluir a conta"
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
                  Cancelar
                </Button>
                <Button type="submit" className={DANGER_BUTTON_CLASSES} disabled={isDeleting}>
                  {isDeleting ? 'Excluindo…' : 'Excluir definitivamente'}
                </Button>
              </div>
            </form>
          )}
        </section>
      )}
    </div>
  )
}
