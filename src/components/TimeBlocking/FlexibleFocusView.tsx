import { useSettings } from '../../context/SettingsContext'
import { useFlexibleTimerContext } from '../../context/FlexibleTimerContext'
import { speciesForIndex } from '../../lib/gardenSpecies'
import { formatMMSS } from '../../lib/timerLogic'
import { Button } from '../common/Button'

const RADIUS = 115
const CIRCUMFERENCE = 2 * Math.PI * RADIUS

/** Emojis de crescimento genéricos (semente → broto → flor), independentes da espécie final. */
const GROWTH_STAGE_EMOJI = ['🌱', '🌿', '🌸'] as const

function growthStageFor(fractionElapsed: number): string {
  if (fractionElapsed >= 0.75) return GROWTH_STAGE_EMOJI[2]
  if (fractionElapsed >= 0.33) return GROWTH_STAGE_EMOJI[1]
  return GROWTH_STAGE_EMOJI[0]
}

const ADD_TIME_OPTIONS_MINUTES = [5, 10] as const

/**
 * Tela de foco rodando/pausado do modo flexível (Parte 5 do plano) — mesma técnica de anel SVG de
 * `TimerDisplay`, duplicada intencionalmente (não extraída) para manter os dois modos sem
 * acoplamento visual. A planta cresce em estágios conforme a fração decorrida; o nome da espécie
 * (`gardenSpecies.ts`) antecipa qual vai florescer quando o bloco completar.
 */
export function FlexibleFocusView() {
  const flexible = useFlexibleTimerContext()
  const { settings } = useSettings()

  const { phase, totalSeconds, remainingSeconds, addedSeconds, focusBlocksCompleted, pause, resume, addTime, endCurrentBlockNow } =
    flexible

  const fractionElapsed = totalSeconds > 0 ? Math.min(1, Math.max(0, 1 - remainingSeconds / totalSeconds)) : 0
  const dashOffset = CIRCUMFERENCE * fractionElapsed
  const isPaused = phase.kind === 'foco_pausado'
  const isAboutToBloom = remainingSeconds <= 0
  const nextSpecies = speciesForIndex(focusBlocksCompleted)

  return (
    <section className="flex w-full flex-col items-center gap-4 rounded-2xl border border-border bg-surface p-6 shadow-card">
      <p className="rounded-full bg-primary-bg px-3.5 py-1 text-style-label-md uppercase tracking-[0.04em] text-primary-dark">
        Foco flexível
      </p>

      <div className="relative h-[min(320px,80vw)] w-[min(320px,80vw)]">
        <svg className="h-full w-full -rotate-90" viewBox="0 0 260 260" aria-hidden="true">
          <circle cx="130" cy="130" r={RADIUS} fill="none" stroke="var(--color-bg-subtle)" strokeWidth="14" />
          <circle
            cx="130"
            cy="130"
            r={RADIUS}
            fill="none"
            stroke="var(--color-primary)"
            strokeWidth="14"
            strokeLinecap="round"
            strokeDasharray={CIRCUMFERENCE}
            strokeDashoffset={dashOffset}
            className="transition-[stroke-dashoffset] duration-1000 ease-linear"
          />
        </svg>

        <div className="absolute inset-0 flex flex-col items-center justify-center gap-1">
          <span
            className={`-translate-y-2 text-[56px] ${isAboutToBloom && !settings.reduceAnimations ? 'animate-[mascotBounce_0.6s_ease-in-out_infinite]' : ''}`}
            aria-hidden="true"
          >
            {growthStageFor(fractionElapsed)}
          </span>
          <span className="text-style-display-timer-mobile text-text-h">{formatMMSS(remainingSeconds)}</span>
          <span className="text-style-label-sm text-text-muted">
            Vai virar {nextSpecies.name} {nextSpecies.emoji}
          </span>
        </div>
      </div>

      {addedSeconds > 0 && (
        <span className="rounded-full bg-tertiary-bg px-2.5 py-1 text-style-label-sm text-on-tertiary-chip">
          +{Math.round(addedSeconds / 60)} min adicionados
        </span>
      )}

      <div className="flex flex-wrap items-center justify-center gap-4">
        {isPaused ? <Button onClick={resume}>Continuar</Button> : <Button onClick={pause}>Pausar</Button>}

        {ADD_TIME_OPTIONS_MINUTES.map((minutes) => (
          <Button key={minutes} variant="secondary" onClick={() => addTime(minutes * 60)}>
            +{minutes} min
          </Button>
        ))}

        <Button variant="ghost" onClick={endCurrentBlockNow}>
          Encerrar agora
        </Button>
      </div>
    </section>
  )
}
