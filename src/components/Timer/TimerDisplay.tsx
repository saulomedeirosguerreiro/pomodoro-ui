import { formatMMSS, SESSION_DURATIONS_SECONDS, SESSION_LABELS } from '../../lib/timerLogic'
import type { SessionType } from '../../types/api'

const RADIUS = 115
const CIRCUMFERENCE = 2 * Math.PI * RADIUS

const TYPE_CLASSES: Record<SessionType, string> = {
  foco: 'bg-primary-bg text-primary-dark',
  descanso_curto: 'bg-secondary-bg text-secondary-dark',
  descanso_longo: 'bg-secondary-bg text-secondary-dark',
}

interface TimerDisplayProps {
  type: SessionType
  remainingSeconds: number
  cycleCount: number
}

export function TimerDisplay({ type, remainingSeconds, cycleCount }: TimerDisplayProps) {
  const totalSeconds = SESSION_DURATIONS_SECONDS[type]
  const fractionRemaining = totalSeconds > 0 ? Math.min(1, Math.max(0, remainingSeconds / totalSeconds)) : 0
  const dashOffset = CIRCUMFERENCE * (1 - fractionRemaining)

  return (
    <div className="flex flex-col items-center gap-4 py-6">
      <p
        className={`rounded-full px-3.5 py-1 text-style-label-md uppercase tracking-[0.04em] ${TYPE_CLASSES[type]}`}
      >
        {SESSION_LABELS[type]}
      </p>

      <div className="relative h-[min(320px,80vw)] w-[min(320px,80vw)]">
        <svg className="h-full w-full -rotate-90" viewBox="0 0 260 260" aria-hidden="true">
          <circle cx="130" cy="130" r={RADIUS} fill="none" stroke="var(--color-bg-subtle)" strokeWidth="14" />
          <defs>
            <linearGradient id="pomoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="var(--color-primary)" />
              <stop offset="60%" stopColor="var(--color-tertiary)" />
              <stop offset="100%" stopColor="var(--color-highlight)" />
            </linearGradient>
          </defs>
          <circle
            cx="130"
            cy="130"
            r={RADIUS}
            fill="none"
            stroke="url(#pomoGradient)"
            strokeWidth="14"
            strokeLinecap="round"
            strokeDasharray={CIRCUMFERENCE}
            strokeDashoffset={dashOffset}
            className="transition-[stroke-dashoffset] duration-1000 ease-linear"
          />
        </svg>

        <div className="absolute inset-0 flex flex-col items-center justify-center gap-1">
          <span className="text-style-display-timer-mobile text-text-h sm:text-style-display-timer">
            {formatMMSS(remainingSeconds)}
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-bg-subtle px-2 py-1 text-style-label-sm text-secondary-dark">
            Ciclo {Math.min(cycleCount + 1, 4)} de 4
          </span>
        </div>
      </div>
    </div>
  )
}
