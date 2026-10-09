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
        className="flex items-center gap-2"
        role="progressbar"
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={safeMax}
        aria-label={label}
      >
        {segments.map((filled, i) => (
          <span
            key={i}
            className={`h-3 flex-1 rounded-full ${filled ? 'bg-primary' : 'border border-border bg-bg-subtle'}`}
          />
        ))}
      </div>
    )
  }

  return (
    <div
      className="h-2 w-full overflow-hidden rounded-full bg-bg-subtle"
      role="progressbar"
      aria-valuenow={value}
      aria-valuemin={0}
      aria-valuemax={safeMax}
      aria-label={label}
    >
      <div
        className="h-full rounded-full bg-gradient-to-r from-primary to-tertiary transition-[width] duration-300 ease-out"
        style={{ width: `${percent}%` }}
      />
    </div>
  )
}
