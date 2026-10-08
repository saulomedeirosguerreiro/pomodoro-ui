import type { ReactNode } from 'react'
import styles from './SpeechBubble.module.css'

export function SpeechBubble({ children }: { children: ReactNode }) {
  return (
    <div className={styles.bubble}>
      <p className={styles.text}>{children}</p>
      <div className={styles.arrow} />
    </div>
  )
}
