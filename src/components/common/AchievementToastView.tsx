import { useEffect } from 'react'
import type { Achievement } from '../../types/api'
import styles from './AchievementToastView.module.css'

const AUTO_DISMISS_MS = 5000

export function AchievementToastView({ achievement, onDismiss }: { achievement: Achievement; onDismiss: () => void }) {
  useEffect(() => {
    const timeoutId = setTimeout(onDismiss, AUTO_DISMISS_MS)
    return () => clearTimeout(timeoutId)
  }, [achievement, onDismiss])

  return (
    <div className={styles.toast} role="status">
      <p className={styles.badge}>🏆 Nova conquista!</p>
      <p className={styles.name}>{achievement.name}</p>
      <p className={styles.description}>{achievement.description}</p>
    </div>
  )
}
