import type { ReactNode } from 'react'
import styles from './AuthLayout.module.css'

export function AuthLayout({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <h1 className={styles.title}>Pomodoro</h1>
        <h2 className={styles.subtitle}>{title}</h2>
        {children}
      </div>
    </div>
  )
}
