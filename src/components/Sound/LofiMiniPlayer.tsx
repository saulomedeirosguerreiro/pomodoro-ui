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
 * Player lo-fi compacto — única instância do player no app, renderizada no header (desktop) e na
 * barra fixa do rodapé (mobile) via `LofiPlayerContext` compartilhado (um só `<audio>` real: tocar,
 * pausar ou trocar de faixa em qualquer uma reflete na outra). Nome da faixa e crédito do autor ficam
 * empilhados sob os botões, igual a um mini player de música comum (ex.: Spotify/Apple Music).
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

      <div className="flex w-[120px] min-w-0 flex-col sm:w-[150px]">
        <label htmlFor={trackSelectId} className="sr-only">
          Escolher faixa lo-fi (mini player)
        </label>
        <select
          id={trackSelectId}
          title={track.title}
          className="w-full truncate rounded-full border border-border bg-surface px-2 py-1 text-style-label-sm text-text-h"
          value={trackIndex}
          onChange={(e) => selectTrack(Number(e.target.value))}
        >
          {LOFI_TRACKS.map((lofiTrack, index) => (
            <option key={lofiTrack.src} value={index}>
              {lofiTrack.title}
            </option>
          ))}
        </select>
        <span
          title={`Crédito: ${track.credit}`}
          className="truncate px-2 pt-0.5 text-style-label-sm text-text-muted"
        >
          Crédito: {track.credit}
        </span>
      </div>

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
