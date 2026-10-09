import { useId } from 'react'
import { useLofiPlayer } from '../../context/LofiPlayerContext'
import { LOFI_TRACKS } from '../../lib/soundCatalog'

/** Ícone de volume conforme o nível atual — deixa claro, só de olhar, o que o controle ao lado faz. */
function volumeIcon(value: number): string {
  if (value <= 0) return '🔇'
  if (value < 0.5) return '🔈'
  return '🔊'
}

/** US-57: player lo-fi dentro do Checklist — consome o estado compartilhado de `LofiPlayerContext`. */
export function LofiPlayer() {
  const { track, trackIndex, isPlaying, message, volume, handlePlayPause, handleNext, selectTrack, setVolume } =
    useLofiPlayer()
  const trackSelectId = useId()

  return (
    <section className="flex flex-col gap-1 border-t border-dashed border-border pt-2">
      <h3 className="text-style-label-md text-text-h">🎧 Lo-Fi para focar</h3>

      <label htmlFor={trackSelectId} className="sr-only">
        Escolher faixa lo-fi
      </label>
      <select
        id={trackSelectId}
        className="w-full rounded-lg border border-border bg-input-bg px-2 py-1.5 text-style-body-sm text-text-h"
        value={trackIndex}
        onChange={(e) => selectTrack(Number(e.target.value))}
      >
        {LOFI_TRACKS.map((lofiTrack, index) => (
          <option key={lofiTrack.src} value={index}>
            {lofiTrack.title}
          </option>
        ))}
      </select>
      <p className="text-style-label-sm text-text-muted">Crédito: {track.credit}</p>

      <div className="mt-1 flex items-center gap-2">
        <button
          type="button"
          className="h-8 w-8 rounded-full border border-border bg-surface"
          onClick={handlePlayPause}
          aria-label={isPlaying ? 'Pausar lo-fi' : 'Tocar lo-fi'}
        >
          {isPlaying ? '⏸' : '▶'}
        </button>
        <button
          type="button"
          className="h-8 w-8 rounded-full border border-border bg-surface"
          onClick={handleNext}
          aria-label="Próxima faixa"
        >
          ⏭
        </button>
        <span aria-hidden="true" title="Volume">
          {volumeIcon(volume)}
        </span>
        <input
          type="range"
          min={0}
          max={1}
          step={0.05}
          value={volume}
          onChange={(e) => setVolume(Number(e.target.value))}
          aria-label="Volume do lo-fi"
        />
      </div>

      {message && <p className="text-style-label-sm text-text-muted">{message}</p>}
    </section>
  )
}
