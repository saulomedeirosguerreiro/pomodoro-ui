import { useId } from 'react'
import { useLofiPlayer } from '../../context/LofiPlayerContext'
import { LOFI_TRACKS } from '../../lib/soundCatalog'

/** Ícone de volume conforme o nível atual — deixa claro, só de olhar, o que o controle ao lado faz. */
function volumeIcon(value: number): string {
  if (value <= 0) return '🔇'
  if (value < 0.5) return '🔈'
  return '🔊'
}

/**
 * Versão compacta do player lo-fi para o header (desktop) e para a barra fixa do rodapé (mobile) —
 * mesmo estado de `LofiPlayerContext` do `LofiPlayer` do Checklist, incluindo a escolha direta de
 * faixa (mesmo `<select>`, só mais estreito pra caber nos dois lugares).
 */
export function LofiMiniPlayer() {
  const { track, trackIndex, isPlaying, message, volume, handlePlayPause, handleNext, selectTrack, setVolume } =
    useLofiPlayer()
  const trackSelectId = useId()

  return (
    <div className="relative flex items-center gap-1">
      <button
        type="button"
        className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-border bg-surface"
        onClick={handlePlayPause}
        aria-label={isPlaying ? 'Pausar música de fundo' : 'Tocar música de fundo'}
      >
        {isPlaying ? '⏸' : '▶'}
      </button>

      <button
        type="button"
        className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-border bg-surface"
        onClick={handleNext}
        aria-label="Próxima música de fundo"
      >
        ⏭
      </button>

      <label htmlFor={trackSelectId} className="sr-only">
        Escolher faixa lo-fi (mini player)
      </label>
      <select
        id={trackSelectId}
        title={track.title}
        className="w-[120px] truncate rounded-full border border-border bg-surface px-2 py-1.5 text-style-label-sm text-text-h sm:w-[150px]"
        value={trackIndex}
        onChange={(e) => selectTrack(Number(e.target.value))}
      >
        {LOFI_TRACKS.map((lofiTrack, index) => (
          <option key={lofiTrack.src} value={index}>
            {lofiTrack.title}
          </option>
        ))}
      </select>

      <span aria-hidden="true" title="Volume" className="shrink-0">
        {volumeIcon(volume)}
      </span>
      <input
        type="range"
        className="w-[60px] shrink-0 sm:w-[72px]"
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
