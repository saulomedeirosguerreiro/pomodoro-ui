import { useState } from 'react'
import { useSettings } from '../../context/SettingsContext'
import { AMBIENT_TRACKS } from '../../lib/soundCatalog'
import type { AmbientTrackId } from '../../lib/settings'
import styles from './AmbientPlayer.module.css'

/** US-56: mini player de som ambiente. Sem arquivo real ainda — "play" mostra um aviso amigável (CA-002). */
export function AmbientPlayer() {
  const { settings, updateSettings } = useSettings()
  const [isPlaying, setIsPlaying] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  function handlePlayPause() {
    if (!settings.ambientTrack) {
      setMessage('Escolha um ambiente primeiro.')
      return
    }

    if (isPlaying) {
      setIsPlaying(false)
      return
    }

    setMessage('Esse áudio ainda não está disponível nesta versão.')
  }

  function handleSelect(trackId: AmbientTrackId) {
    updateSettings({ ambientTrack: trackId })
    setMessage(null)
    setIsPlaying(false)
  }

  return (
    <div className={styles.player}>
      <select
        className={styles.select}
        value={settings.ambientTrack ?? ''}
        onChange={(e) => handleSelect(e.target.value as AmbientTrackId)}
        aria-label="Som ambiente"
      >
        <option value="" disabled>
          Som ambiente
        </option>
        {AMBIENT_TRACKS.map((track) => (
          <option key={track.id} value={track.id}>
            {track.label}
          </option>
        ))}
      </select>

      <button
        type="button"
        className={styles.playButton}
        onClick={handlePlayPause}
        aria-label={isPlaying ? 'Pausar ambiente' : 'Tocar ambiente'}
      >
        {isPlaying ? '⏸' : '▶'}
      </button>

      <input
        type="range"
        className={styles.volume}
        min={0}
        max={1}
        step={0.05}
        value={settings.ambientVolume}
        onChange={(e) => updateSettings({ ambientVolume: Number(e.target.value) })}
        aria-label="Volume do ambiente"
      />

      {message && <span className={styles.message}>{message}</span>}
    </div>
  )
}
