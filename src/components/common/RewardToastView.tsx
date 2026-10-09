import { useEffect } from 'react'
import type { RewardToast } from '../../context/TimerContext'

const AUTO_DISMISS_MS = 4000

export function RewardToastView({ toast, onDismiss }: { toast: RewardToast; onDismiss: () => void }) {
  useEffect(() => {
    const timeoutId = setTimeout(onDismiss, AUTO_DISMISS_MS)
    return () => clearTimeout(timeoutId)
  }, [toast, onDismiss])

  return (
    <div
      className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-2xl border-2 border-highlight bg-surface px-6 py-4 text-center shadow-popover"
      role="status"
    >
      <p className="text-style-label-lg text-primary-dark">
        +{toast.xp} XP · +{toast.seeds} 🌱 Sementes
      </p>
      {toast.leveledUp && (
        <p className="mt-1 text-style-headline-sm text-secondary-dark">Subiu para o Nível {toast.newLevel}! 🎉</p>
      )}
    </div>
  )
}
