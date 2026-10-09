import type { ReactNode } from 'react'

type BadgeVariant = 'primary' | 'secondary' | 'tertiary' | 'highlight' | 'neutral'

const VARIANT_CLASSES: Record<BadgeVariant, string> = {
  primary: 'bg-primary-bg text-primary-dark',
  secondary: 'bg-secondary-bg text-secondary-dark',
  tertiary: 'bg-tertiary-bg text-on-tertiary-chip',
  highlight: 'bg-highlight-bg text-on-highlight-chip',
  neutral: 'border border-border bg-bg-subtle text-text-muted',
}

export function Badge({ children, variant = 'neutral' }: { children: ReactNode; variant?: BadgeVariant }) {
  return (
    <span
      className={`inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2.5 py-0.5 text-style-label-sm ${VARIANT_CLASSES[variant]}`}
    >
      {children}
    </span>
  )
}
