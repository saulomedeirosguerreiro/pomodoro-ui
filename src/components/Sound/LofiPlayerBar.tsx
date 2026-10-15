import { useId } from 'react'
import { useLofiPlayer } from '../../context/LofiPlayerContext'
import { formatMMSS } from '../../lib/timerLogic'
import { LOFI_TRACKS } from '../../lib/soundCatalog'

/** Ícone de volume conforme o nível atual — deixa claro, só de olhar, o que o controle ao lado faz. */
function volumeIcon(value: number): string {
  if (value <= 0) return '🔇'
  if (value < 0.5) return '🔈'
  return '🔊'
}

/** Ícone de repetição em SVG (não emoji), pra herdar `currentColor` e ficar no mesmo estilo visual
    dos outros ícones do app (ex.: `ThemeToggle`) em vez de destoar dos glifos de transporte. */
function LoopIcon({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M17 1l4 4-4 4" />
      <path d="M3 11V9a4 4 0 0 1 4-4h14" />
      <path d="M7 23l-4-4 4-4" />
      <path d="M21 13v2a4 4 0 0 1-4 4H3" />
    </svg>
  )
}

const TRANSPORT_BUTTON_CLASSES =
  'inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-border bg-surface text-text-h transition-colors hover:bg-bg-subtle lg:h-9 lg:w-9'

/**
 * Barra fixa do player lo-fi — única instância no app, sempre no rodapé (antes vivia espremida no
 * header no desktop e só aparecia como barra no mobile; agora é uma barra só, em qualquer tamanho de
 * tela, inspirada no player do Spotify). No mobile fica compacta (capa + transporte + faixa/crédito
 * + linha fina de progresso); no desktop (`lg:`) ganha a largura toda: capa maior à esquerda,
 * transporte + barra de progresso arrastável no centro, volume à direita.
 */
export function LofiPlayerBar() {
  const {
    track,
    trackIndex,
    isPlaying,
    isLoopEnabled,
    message,
    volume,
    currentTime,
    duration,
    handlePlayPause,
    handleNext,
    handlePrevious,
    toggleLoop,
    selectTrack,
    setVolume,
    seek,
  } = useLofiPlayer()
  const trackSelectId = useId()
  const progressPercent = duration > 0 ? Math.min(100, (currentTime / duration) * 100) : 0

  return (
    <div className="relative flex w-full flex-col border-t border-border bg-surface">
      {message && (
        <span className="absolute bottom-full left-1/2 mb-2 max-w-[calc(100vw-2rem)] -translate-x-1/2 whitespace-normal rounded-lg border border-border bg-surface px-2 py-1 text-center text-style-label-sm text-text-muted shadow-card">
          {message}
        </span>
      )}

      {/* Linha fina de progresso encostada no topo, estilo mini-player mobile do Spotify — só abaixo
          de `lg`, onde a barra de progresso de verdade (arrastável) já aparece no centro. */}
      <div className="h-[2px] w-full bg-bg-subtle lg:hidden">
        <div className="h-full bg-primary transition-[width] duration-200" style={{ width: `${progressPercent}%` }} />
      </div>

      <div className="flex items-center gap-3 px-3 py-2 lg:gap-6 lg:px-6 lg:py-3">
        {/* Esquerda: "capa" + faixa + crédito */}
        <div className="flex min-w-0 flex-1 items-center gap-3 lg:w-[260px] lg:flex-none">
          <img
            src={track.cover}
            alt=""
            aria-hidden="true"
            className="h-10 w-10 shrink-0 rounded-lg object-cover lg:h-14 lg:w-14 lg:rounded-xl"
          />
          <div className="min-w-0 flex-1">
            <label htmlFor={trackSelectId} className="sr-only">
              Escolher faixa lo-fi
            </label>
            <select
              id={trackSelectId}
              title={track.title}
              className="w-full truncate border-0 bg-transparent p-0 text-style-label-md text-text-h lg:text-style-label-lg"
              value={trackIndex}
              onChange={(e) => selectTrack(Number(e.target.value))}
            >
              {LOFI_TRACKS.map((lofiTrack, index) => (
                <option key={lofiTrack.src} value={index} className="bg-surface text-text-h">
                  {lofiTrack.title}
                </option>
              ))}
            </select>
            <p title={`Crédito: ${track.credit}`} className="truncate text-style-label-sm text-text-muted">
              Crédito: {track.credit}
            </p>
          </div>
        </div>

        {/* Centro: transporte (prev/play/next, sempre visível) + progresso de verdade (só desktop).
            `flex-none` no mobile (tamanho justo pros 3 botões, sobra de espaço vai pra esquerda, que
            é quem precisa truncar texto); `lg:flex-1` no desktop, pra ocupar o centro da barra. */}
        <div className="flex flex-none flex-col items-center gap-1.5 lg:flex-1 lg:max-w-[640px]">
          <div className="flex items-center gap-3 lg:gap-4">
            <button
              type="button"
              className={TRANSPORT_BUTTON_CLASSES}
              onClick={handlePrevious}
              aria-label="Faixa anterior"
            >
              ⏮
            </button>
            <button
              type="button"
              className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-text-h text-bg transition-transform active:scale-95 lg:h-10 lg:w-10"
              onClick={handlePlayPause}
              aria-label={isPlaying ? 'Pausar música de fundo' : 'Tocar música de fundo'}
            >
              {isPlaying ? '⏸' : '▶'}
            </button>
            <button
              type="button"
              className={TRANSPORT_BUTTON_CLASSES}
              onClick={handleNext}
              aria-label="Próxima música de fundo"
            >
              ⏭
            </button>
            <button
              type="button"
              className={`${TRANSPORT_BUTTON_CLASSES} ${
                isLoopEnabled ? 'border-primary-border bg-primary-bg text-primary' : ''
              }`}
              onClick={toggleLoop}
              aria-pressed={isLoopEnabled}
              aria-label={isLoopEnabled ? 'Desativar repetição da faixa atual' : 'Repetir a faixa atual'}
            >
              <LoopIcon className="h-4 w-4" />
            </button>
          </div>

          <div className="hidden w-full items-center gap-2 lg:flex">
            <span className="text-style-label-sm text-text-muted">{formatMMSS(currentTime)}</span>
            <input
              type="range"
              className="flex-1"
              min={0}
              max={duration || 0}
              step={1}
              value={Math.min(currentTime, duration || 0)}
              onChange={(e) => seek(Number(e.target.value))}
              aria-label="Progresso da faixa"
            />
            <span className="text-style-label-sm text-text-muted">{formatMMSS(duration)}</span>
          </div>
        </div>

        {/* Direita: volume — só desktop, igual ao mini player mobile do Spotify (que esconde o volume). */}
        <div className="hidden shrink-0 items-center gap-2 lg:flex lg:w-[160px] lg:justify-end">
          <span aria-hidden="true" title="Volume">
            {volumeIcon(volume)}
          </span>
          <input
            type="range"
            className="w-[100px]"
            min={0}
            max={1}
            step={0.05}
            value={volume}
            onChange={(e) => setVolume(Number(e.target.value))}
            aria-label="Volume da música de fundo"
          />
        </div>
      </div>
    </div>
  )
}
