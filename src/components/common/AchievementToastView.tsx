import { useEffect } from 'react'
import type { Achievement } from '../../types/api'

const AUTO_DISMISS_MS = 5000

export function AchievementToastView({ achievement, onDismiss }: { achievement: Achievement; onDismiss: () => void }) {
  useEffect(() => {
    const timeoutId = setTimeout(onDismiss, AUTO_DISMISS_MS)
    return () => clearTimeout(timeoutId)
  }, [achievement, onDismiss])

  return (
    <div
      className="fixed bottom-24 left-1/2 z-50 max-w-[320px] -translate-x-1/2 rounded-2xl border-2 border-tertiary bg-surface px-6 py-4 text-center shadow-popover"
      role="status"
    >
      <p className="inline-block rounded-full bg-tertiary-bg px-2 py-0.5 text-style-label-sm uppercase text-on-tertiary-chip">
        🏆 Nova conquista!
      </p>
      <p className="text-style-headline-sm text-text-h">{achievement.name}</p>
      <p className="text-style-body-sm text-text-muted">{achievement.description}</p>
    </div>
  )
}
