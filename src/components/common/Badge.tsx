import type { ReactNode } from 'react'
import styles from './Badge.module.css'

type BadgeVariant = 'primary' | 'secondary' | 'tertiary' | 'highlight' | 'neutral'

export function Badge({ children, variant = 'neutral' }: { children: ReactNode; variant?: BadgeVariant }) {
  return <span className={`${styles.badge} ${styles[variant]}`}>{children}</span>
}
