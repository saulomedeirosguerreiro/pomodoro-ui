import { useState } from 'react'
import { Button } from '../components/common/Button'
import { Checkbox } from '../components/common/Checkbox'
import { useSettings } from '../context/SettingsContext'
import { getNotificationPermission, requestNotificationPermission } from '../lib/notifications'
import styles from './ConfiguracoesPage.module.css'

export function ConfiguracoesPage() {
  const { settings, updateSettings } = useSettings()
  const [permission, setPermission] = useState(getNotificationPermission())

  async function handleRequestPermission() {
    const result = await requestNotificationPermission()
    setPermission(result)
    if (result === 'granted') {
      updateSettings({ notificationsEnabled: true })
    }
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
    </div>
  )
}
