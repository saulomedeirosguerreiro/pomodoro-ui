import styles from './ProgressBar.module.css'

interface ProgressBarProps {
  value: number
  max: number
  variant?: 'linear' | 'segmented'
  label?: string
}

export function ProgressBar({ value, max, variant = 'linear', label }: ProgressBarProps) {
  const safeMax = Math.max(1, max)
  const percent = Math.min(100, Math.max(0, (value / safeMax) * 100))

  if (variant === 'segmented') {
    const segments = Array.from({ length: safeMax }, (_, i) => i < value)
    return (
      <div
        className={styles.segmentedTrack}
        role="progressbar"
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={safeMax}
        aria-label={label}
      >
        {segments.map((filled, i) => (
          <span key={i} className={filled ? styles.segmentFilled : styles.segmentEmpty} />
        ))}
      </div>
    )
  }

  return (
    <div
      className={styles.track}
      role="progressbar"
      aria-valuenow={value}
      aria-valuemin={0}
      aria-valuemax={safeMax}
      aria-label={label}
    >
      <div className={styles.fill} style={{ width: `${percent}%` }} />
    </div>
  )
}
