import { useEffect } from 'react'
import type { RewardToast } from '../../context/TimerContext'
import styles from './RewardToastView.module.css'

const AUTO_DISMISS_MS = 4000

export function RewardToastView({ toast, onDismiss }: { toast: RewardToast; onDismiss: () => void }) {
  useEffect(() => {
    const timeoutId = setTimeout(onDismiss, AUTO_DISMISS_MS)
    return () => clearTimeout(timeoutId)
  }, [toast, onDismiss])

  return (
    <div className={styles.toast} role="status">
      <p className={styles.reward}>
        +{toast.xp} XP · +{toast.seeds} 🌱 Sementes
      </p>
      {toast.leveledUp && <p className={styles.levelUp}>Subiu para o Nível {toast.newLevel}! 🎉</p>}
    </div>
  )
}
