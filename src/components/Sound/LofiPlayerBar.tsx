import { useId } from 'react'
import { useTranslation } from 'react-i18next'
import { useLofiPlayer } from '../../context/LofiPlayerContext'
import { formatMMSS } from '../../lib/timerLogic'
import { LOFI_TRACKS } from '../../lib/soundCatalog'

/** Nível do volume em texto — só pra expor um atributo testável no ícone (ver `data-volume-level`
    abaixo), já que o SVG não tem mais um texto/emoji simples pra asserção de teste verificar. */
function volumeLevel(value: number): 'muted' | 'low' | 'high' {
  if (value <= 0) return 'muted'
  if (value < 0.5) return 'low'
  return 'high'
}

/** Ícone de volume conforme o nível atual (SVG, não emoji — mesmo motivo do `LoopIcon`/ícones de
    transporte abaixo: herda `currentColor` e mantém o estilo monocromático dos outros ícones do
    app, em vez de destoar com um emoji colorido do lado). */
function VolumeIcon({ value, className }: { value: number; className?: string }) {
  if (value <= 0) {
    return (
      <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className={className}>
        <path d="M11 5 6 9H3v6h3l5 4V5z" />
        <line x1="16" y1="9" x2="22" y2="15" />
        <line x1="22" y1="9" x2="16" y2="15" />
      </svg>
    )
  }
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M11 5 6 9H3v6h3l5 4V5z" />
      {value >= 0.5 && <path d="M18.5 8.5a6 6 0 0 1 0 7" />}
      <path d="M15.5 10.5a2.5 2.5 0 0 1 0 3" />
    </svg>
  )
}

/** Ícone de repetição em SVG (não emoji), pra herdar `currentColor` e ficar no mesmo estilo visual
    dos outros ícones do app (ex.: `ThemeToggle`, `SkipBackIcon`/`PlayIcon`/etc. abaixo). */
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

/** Mesmo motivo do `LoopIcon` acima: os glifos de transporte (⏮ ⏸ ▶ ⏭) dependem de fallback de
    fonte, que varia de tamanho/alinhamento entre navegadores (ok no Chrome devtools, pequeno e
    desalinhado no Safari iOS real) — por isso viram SVG também, em vez de texto. */
function SkipBackIcon({ className }: { className?: string }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" fill="currentColor" className={className}>
      <rect x="5" y="5" width="2" height="14" rx="1" />
      <path d="M19 5.5v13a1 1 0 0 1-1.5.87l-10-6.5a1 1 0 0 1 0-1.74l10-6.5A1 1 0 0 1 19 5.5z" />
    </svg>
  )
}

function SkipForwardIcon({ className }: { className?: string }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" fill="currentColor" className={className}>
      <rect x="17" y="5" width="2" height="14" rx="1" />
      <path d="M5 5.5v13a1 1 0 0 0 1.5.87l10-6.5a1 1 0 0 0 0-1.74l-10-6.5A1 1 0 0 0 5 5.5z" />
    </svg>
  )
}

function PlayIcon({ className }: { className?: string }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M7 5.5v13a1 1 0 0 0 1.5.87l10-6.5a1 1 0 0 0 0-1.74l-10-6.5A1 1 0 0 0 7 5.5z" />
    </svg>
  )
}

function PauseIcon({ className }: { className?: string }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" fill="currentColor" className={className}>
      <rect x="6" y="5" width="4" height="14" rx="1" />
      <rect x="14" y="5" width="4" height="14" rx="1" />
    </svg>
  )
}

const TRANSPORT_BUTTON_BASE = 'inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition-colors lg:h-9 lg:w-9'
const TRANSPORT_BUTTON_CLASSES = `${TRANSPORT_BUTTON_BASE} border border-border bg-surface text-text-h hover:bg-bg-subtle`
/** Estado "selecionado" do loop: preenchimento sólido, não a mesma mancha sutil do hover dos outros
    botões — precisa ser reconhecível como toggle ativo, não como um botão só em hover. */
const LOOP_BUTTON_ACTIVE_CLASSES = `${TRANSPORT_BUTTON_BASE} border border-transparent bg-primary text-bg hover:bg-primary-dark`

/**
 * Barra fixa do player lo-fi — única instância no app, sempre no rodapé (antes vivia espremida no
 * header no desktop e só aparecia como barra no mobile; agora é uma barra só, em qualquer tamanho de
 * tela, inspirada no player do Spotify). No mobile fica compacta (capa + transporte + faixa/crédito
 * + linha fina de progresso); no desktop (`lg:`) ganha a largura toda: capa maior à esquerda,
 * transporte + barra de progresso arrastável no centro, volume à direita.
 */
export function LofiPlayerBar() {
  const { t } = useTranslation('sound')
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
              {t('selectTrack')}
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
            <p title={t('credit', { credit: track.credit })} className="truncate text-style-label-sm text-text-muted">
              {t('credit', { credit: track.credit })}
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
              aria-label={t('previous')}
            >
              <SkipBackIcon className="h-4 w-4" />
            </button>
            <button
              type="button"
              className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-text-h text-bg transition-transform active:scale-95 lg:h-10 lg:w-10"
              onClick={handlePlayPause}
              aria-label={isPlaying ? t('pause') : t('play')}
            >
              {isPlaying ? <PauseIcon className="h-4 w-4" /> : <PlayIcon className="h-4 w-4" />}
            </button>
            <button
              type="button"
              className={TRANSPORT_BUTTON_CLASSES}
              onClick={handleNext}
              aria-label={t('next')}
            >
              <SkipForwardIcon className="h-4 w-4" />
            </button>
            <button
              type="button"
              className={isLoopEnabled ? LOOP_BUTTON_ACTIVE_CLASSES : TRANSPORT_BUTTON_CLASSES}
              onClick={toggleLoop}
              aria-pressed={isLoopEnabled}
              aria-label={isLoopEnabled ? t('loopOff') : t('loopOn')}
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
              aria-label={t('progress')}
            />
            <span className="text-style-label-sm text-text-muted">{formatMMSS(duration)}</span>
          </div>
        </div>

        {/* Direita: volume — só desktop, igual ao mini player mobile do Spotify (que esconde o volume). */}
        <div className="hidden shrink-0 items-center gap-2 lg:flex lg:w-[160px] lg:justify-end">
          <span className="text-text-h" title={t('volume')} data-volume-level={volumeLevel(volume)}>
            <VolumeIcon value={volume} className="h-4 w-4" />
          </span>
          <input
            type="range"
            className="w-[100px]"
            min={0}
            max={1}
            step={0.05}
            value={volume}
            onChange={(e) => setVolume(Number(e.target.value))}
            aria-label={t('volumeControl')}
          />
        </div>
      </div>
    </div>
  )
}
