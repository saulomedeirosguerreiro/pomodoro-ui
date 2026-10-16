import { useTranslation } from 'react-i18next'
import { useSettings } from '../../context/SettingsContext'
import { useFlexibleTimerContext } from '../../context/FlexibleTimerContext'
import { speciesForIndex } from '../../lib/gardenSpecies'
import { formatMMSS } from '../../lib/timerLogic'
import { Button } from '../common/Button'
import { FlexibleModeToggle } from './FlexibleModeToggle'

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
  const { t } = useTranslation('timer')
  const flexible = useFlexibleTimerContext()
  const { settings } = useSettings()

  const {
    phase,
    totalSeconds,
    remainingSeconds,
    addedSeconds,
    focusBlocksCompleted,
    pause,
    resume,
    addTime,
    endCurrentBlockNow,
    goToBreakNow,
  } = flexible

  const fractionElapsed = totalSeconds > 0 ? Math.min(1, Math.max(0, 1 - remainingSeconds / totalSeconds)) : 0
  const dashOffset = CIRCUMFERENCE * fractionElapsed
  const isPaused = phase.kind === 'foco_pausado'
  const isAboutToBloom = remainingSeconds <= 0
  const nextSpecies = speciesForIndex(focusBlocksCompleted)

  return (
    <section className="flex w-full flex-col items-center gap-4 rounded-2xl border border-border bg-surface p-6 shadow-card">
      <FlexibleModeToggle
        value="foco"
        onChange={(next) => {
          if (next === 'pausa') goToBreakNow()
        }}
      />

      <div className="relative h-[min(320px,calc(100vw-80px))] w-[min(320px,calc(100vw-80px))]">
        <svg className="block h-full w-full -rotate-90" viewBox="0 0 260 260" aria-hidden="true">
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
            {t('flexibleFocusView.nextSpecies', { name: nextSpecies.name, emoji: nextSpecies.emoji })}
          </span>
        </div>
      </div>

      {addedSeconds > 0 && (
        <span className="rounded-full bg-tertiary-bg px-2.5 py-1 text-style-label-sm text-on-tertiary-chip">
          {t('flexibleFocusView.addedTime', { minutes: Math.round(addedSeconds / 60) })}
        </span>
      )}

      <div className="flex flex-wrap items-center justify-center gap-4">
        {isPaused ? (
          <Button onClick={resume}>{t('controls.resume')}</Button>
        ) : (
          <Button onClick={pause}>{t('controls.pause')}</Button>
        )}

        {ADD_TIME_OPTIONS_MINUTES.map((minutes) => (
          <Button key={minutes} variant="secondary" onClick={() => addTime(minutes * 60)}>
            {t('addMinutesButton', { minutes })}
          </Button>
        ))}

        <Button variant="ghost" onClick={endCurrentBlockNow}>
          {t('controls.finalize')}
        </Button>
      </div>
    </section>
  )
}
