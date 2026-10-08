import { useState } from 'react'
import { useSettings } from '../../context/SettingsContext'
import { LOFI_TRACKS } from '../../lib/soundCatalog'
import styles from './LofiPlayer.module.css'

/** US-57: player lo-fi dentro do Checklist. Sem arquivo real ainda — mesmo aviso do ambiente (G-Q15). */
export function LofiPlayer() {
  const { settings, updateSettings } = useSettings()
  const [trackIndex, setTrackIndex] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  const track = LOFI_TRACKS[trackIndex]

  function handlePlayPause() {
    if (isPlaying) {
      setIsPlaying(false)
      return
    }
    setMessage('Esse áudio ainda não está disponível nesta versão.')
  }

  function handleNext() {
    setTrackIndex((index) => (index + 1) % LOFI_TRACKS.length)
    setMessage(null)
    setIsPlaying(false)
  }

  return (
    <section className={styles.player}>
      <h3 className={styles.heading}>🎧 Lo-Fi para focar</h3>
      <p className={styles.trackTitle}>{track.title}</p>
      <p className={styles.credit}>Crédito: a definir quando o áudio chegar</p>

      <div className={styles.controls}>
        <button type="button" onClick={handlePlayPause} aria-label={isPlaying ? 'Pausar lo-fi' : 'Tocar lo-fi'}>
          {isPlaying ? '⏸' : '▶'}
        </button>
        <button type="button" onClick={handleNext} aria-label="Próxima faixa">
          ⏭
        </button>
        <input
          type="range"
          min={0}
          max={1}
          step={0.05}
          value={settings.lofiVolume}
          onChange={(e) => updateSettings({ lofiVolume: Number(e.target.value) })}
          aria-label="Volume do lo-fi"
        />
      </div>

      {message && <p className={styles.message}>{message}</p>}
    </section>
  )
}
