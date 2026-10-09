import { ProgressBar } from '../common/ProgressBar'
import type { TaskItem } from '../../types/api'

interface MissionCardProps {
  task: TaskItem | null
}

const CARD_CLASSES = 'flex w-full flex-col gap-2 rounded-2xl border border-border bg-surface p-4 shadow-card'

export function MissionCard({ task }: MissionCardProps) {
  if (!task) {
    return (
      <section className={CARD_CLASSES}>
        <h2 className="text-style-headline-sm">🎯 Missão do Momento</h2>
        <p className="text-style-body-sm text-text-muted">Escolha uma tarefa no checklist abaixo para focar nela.</p>
      </section>
    )
  }

  return (
    <section className={CARD_CLASSES}>
      <h2 className="text-style-headline-sm">🎯 Missão do Momento</h2>
      <p className="text-style-label-md text-text-h">{task.title}</p>
      <ProgressBar
        value={task.completedPomodoros}
        max={task.estimatedPomodoros}
        label={`${task.completedPomodoros} de ${task.estimatedPomodoros} pomodoros`}
      />
      <p className="text-style-label-sm text-text-muted">
        {task.completedPomodoros} de {task.estimatedPomodoros} pomodoros
      </p>
    </section>
  )
}
