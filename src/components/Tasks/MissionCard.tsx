import { useTranslation } from 'react-i18next'
import { ProgressBar } from '../common/ProgressBar'
import type { TaskItem } from '../../types/api'

interface MissionCardProps {
  task: TaskItem | null
}

const CARD_CLASSES = 'flex w-full flex-col gap-2 rounded-2xl border border-border bg-surface p-4 shadow-card'

export function MissionCard({ task }: MissionCardProps) {
  const { t } = useTranslation('tasks')

  if (!task) {
    return (
      <section className={CARD_CLASSES}>
        <h2 className="text-style-headline-sm">{t('mission.title')}</h2>
        <p className="text-style-body-sm text-text-muted">{t('mission.empty')}</p>
      </section>
    )
  }

  const progressLabel = t('mission.progress', {
    completed: task.completedPomodoros,
    pomodoroCount: t('pomodoroCount', { count: task.estimatedPomodoros }),
  })

  return (
    <section className={CARD_CLASSES}>
      <h2 className="text-style-headline-sm">{t('mission.title')}</h2>
      <p className="text-style-label-md text-text-h">{task.title}</p>
      <ProgressBar value={task.completedPomodoros} max={task.estimatedPomodoros} label={progressLabel} />
      <p className="text-style-label-sm text-text-muted">{progressLabel}</p>
    </section>
  )
}
