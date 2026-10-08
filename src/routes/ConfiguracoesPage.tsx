import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '../components/common/Button'
import { Checkbox } from '../components/common/Checkbox'
import { Dialog } from '../components/common/Dialog'
import { FormField } from '../components/common/FormField'
import { useAuth } from '../context/AuthContext'
import { useDataSource } from '../context/DataSourceContext'
import { useGuest } from '../context/GuestContext'
import { useSettings } from '../context/SettingsContext'
import { getNotificationPermission, requestNotificationPermission } from '../lib/notifications'
import { usersService } from '../lib/usersService'
import { ApiError } from '../types/api'
import styles from './ConfiguracoesPage.module.css'

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
    <div className={styles.page}>
      <h1>Configurações</h1>

      <section className={styles.card}>
        <h2>Notificações</h2>
        {permission === 'unsupported' && <p className={styles.hint}>Seu navegador não suporta notificações.</p>}
        {permission === 'default' && (
          <Button variant="secondary" onClick={handleRequestPermission}>
            Ativar notificações do navegador
          </Button>
        )}
        {permission === 'denied' && (
          <p className={styles.hint}>
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

      <section className={styles.card}>
        <h2>Mascote</h2>
        <Checkbox
          checked={settings.mascotSpeechEnabled}
          onChange={(checked) => updateSettings({ mascotSpeechEnabled: checked })}
          label="Falas do Tomatinho"
        />
      </section>

      <section className={styles.card}>
        <h2>Acessibilidade</h2>
        <Checkbox
          checked={settings.reduceAnimations}
          onChange={(checked) => updateSettings({ reduceAnimations: checked })}
          label="Reduzir animações"
        />
      </section>

      <section className={styles.card}>
        <h2>Som</h2>
        <Checkbox
          checked={settings.sessionEndSoundEnabled}
          onChange={(checked) => updateSettings({ sessionEndSoundEnabled: checked })}
          label="Som ao final da sessão"
        />
        <p className={styles.hint}>
          Ainda sem arquivo de áudio nesta versão — a preferência já fica pronta para quando ele chegar.
        </p>
      </section>

      {mode === 'guest' ? (
        <section className={`${styles.card} ${styles.dangerZone}`}>
          <h2>Apagar meus dados deste dispositivo</h2>
          <p className={styles.hint}>
            Você está usando o PomoGarden sem conta: tarefas, sessões e conquistas ficam salvas só neste navegador.
            Apagar os dados deste dispositivo os remove para sempre — não há como recuperá-los depois.
          </p>

          <Button variant="ghost" className={styles.dangerButton} onClick={() => setIsConfirmingDelete(true)}>
            Apagar meus dados deste dispositivo
          </Button>

          {isConfirmingDelete && (
            <Dialog titleText="Apagar todos os dados deste dispositivo?" onDismiss={() => setIsConfirmingDelete(false)}>
              <p className={styles.hint}>
                Essa ação não pode ser desfeita. Tarefas, sessões e conquistas salvas neste navegador serão apagadas
                permanentemente.
              </p>
              <div className={styles.deleteActions}>
                <Button variant="ghost" onClick={() => setIsConfirmingDelete(false)}>
                  Cancelar
                </Button>
                <Button className={styles.dangerButton} onClick={handleWipeGuestData}>
                  Apagar definitivamente
                </Button>
              </div>
            </Dialog>
          )}
        </section>
      ) : (
        <section className={`${styles.card} ${styles.dangerZone}`}>
          <h2>Excluir conta</h2>
          <p className={styles.hint}>
            Remove sua conta e todo o histórico (sessões, tarefas, conquistas) para sempre. Essa ação não pode
            ser desfeita.
          </p>

          {!isConfirmingDelete ? (
            <Button variant="ghost" className={styles.dangerButton} onClick={() => setIsConfirmingDelete(true)}>
              Excluir minha conta
            </Button>
          ) : (
            <form className={styles.deleteForm} onSubmit={handleDeleteAccount} noValidate>
              {deleteError && (
                <p className={styles.deleteError} role="alert">
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
              <div className={styles.deleteActions}>
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
                <Button type="submit" className={styles.dangerButton} disabled={isDeleting}>
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
