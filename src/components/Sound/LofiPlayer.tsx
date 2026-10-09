import { useLofiPlayer } from '../../context/LofiPlayerContext'

/** US-57: player lo-fi dentro do Checklist — consome o estado compartilhado de `LofiPlayerContext`. */
export function LofiPlayer() {
  const { track, isPlaying, message, volume, handlePlayPause, handleNext, setVolume } = useLofiPlayer()

  return (
    <section className="flex flex-col gap-0.5 border-t border-dashed border-border pt-2">
      <h3 className="text-style-label-md text-text-h">🎧 Lo-Fi para focar</h3>
      <p className="text-style-body-sm text-text">{track.title}</p>
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
