import { useState } from 'react'
import { useSettings } from '../../context/SettingsContext'
import { AMBIENT_TRACKS } from '../../lib/soundCatalog'
import type { AmbientTrackId } from '../../lib/settings'

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
    <div className="relative flex items-center gap-1">
      <select
        className="max-w-[120px] rounded-full border border-border bg-surface px-2 py-1 text-style-label-sm text-text"
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
        className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-border bg-surface"
        onClick={handlePlayPause}
        aria-label={isPlaying ? 'Pausar ambiente' : 'Tocar ambiente'}
      >
        {isPlaying ? '⏸' : '▶'}
      </button>

      <input
        type="range"
        className="w-[72px]"
        min={0}
        max={1}
        step={0.05}
        value={settings.ambientVolume}
        onChange={(e) => updateSettings({ ambientVolume: Number(e.target.value) })}
        aria-label="Volume do ambiente"
      />

      {message && (
        <span className="absolute right-0 top-full z-10 mt-1 whitespace-nowrap rounded-lg border border-border bg-surface px-2 py-1 text-style-label-sm text-text-muted shadow-card">
          {message}
        </span>
      )}
    </div>
  )
}
