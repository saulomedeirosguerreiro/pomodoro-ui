import { useLofiPlayer } from '../../context/LofiPlayerContext'

/** Versão compacta do player lo-fi para o header — mesmo estado de `LofiPlayerContext` do `LofiPlayer`. */
export function LofiMiniPlayer() {
  const { track, isPlaying, message, volume, handlePlayPause, handleNext, setVolume } = useLofiPlayer()

  return (
    <div className="relative flex items-center gap-1" title={track.title}>
      <button
        type="button"
        className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-border bg-surface"
        onClick={handlePlayPause}
        aria-label={isPlaying ? 'Pausar música de fundo' : 'Tocar música de fundo'}
      >
        {isPlaying ? '⏸' : '▶'}
      </button>

      <button
        type="button"
        className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-border bg-surface"
        onClick={handleNext}
        aria-label="Próxima música de fundo"
      >
        ⏭
      </button>

      <input
        type="range"
        className="w-[72px]"
        min={0}
        max={1}
        step={0.05}
        value={volume}
        onChange={(e) => setVolume(Number(e.target.value))}
        aria-label="Volume da música de fundo"
      />

      {message && (
        <span className="absolute right-0 top-full z-10 mt-1 whitespace-nowrap rounded-lg border border-border bg-surface px-2 py-1 text-style-label-sm text-text-muted shadow-card">
          {message}
        </span>
      )}
    </div>
  )
}
