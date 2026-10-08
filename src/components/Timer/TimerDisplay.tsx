import { formatMMSS, SESSION_DURATIONS_SECONDS, SESSION_LABELS } from '../../lib/timerLogic'
import type { SessionType } from '../../types/api'
import styles from './TimerDisplay.module.css'

const RADIUS = 115
const CIRCUMFERENCE = 2 * Math.PI * RADIUS

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
    <div className={styles.wrapper}>
      <p className={`${styles.type} ${styles[type]}`}>{SESSION_LABELS[type]}</p>

      <div className={styles.ringWrapper}>
        <svg className={styles.ring} viewBox="0 0 260 260" aria-hidden="true">
          <circle cx="130" cy="130" r={RADIUS} fill="none" stroke="var(--bg-subtle)" strokeWidth="14" />
          <defs>
            <linearGradient id="pomoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="var(--primary)" />
              <stop offset="60%" stopColor="var(--tertiary)" />
              <stop offset="100%" stopColor="var(--highlight)" />
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
            className={styles.ringProgress}
          />
        </svg>

        <div className={styles.center}>
          <span className={styles.time}>{formatMMSS(remainingSeconds)}</span>
          <span className={styles.cycle}>Ciclo {Math.min(cycleCount + 1, 4)} de 4</span>
        </div>
      </div>
    </div>
  )
}
