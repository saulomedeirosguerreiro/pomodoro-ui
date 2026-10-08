import { ProgressBar } from '../common/ProgressBar'
import type { TaskItem } from '../../types/api'
import styles from './MissionCard.module.css'

interface MissionCardProps {
  task: TaskItem | null
}

export function MissionCard({ task }: MissionCardProps) {
  if (!task) {
    return (
      <section className={styles.card}>
        <h2>🎯 Missão do Momento</h2>
        <p className={styles.empty}>Escolha uma tarefa no checklist abaixo para focar nela.</p>
      </section>
    )
  }

  return (
    <section className={styles.card}>
      <h2>🎯 Missão do Momento</h2>
      <p className={styles.title}>{task.title}</p>
      <ProgressBar
        value={task.completedPomodoros}
        max={task.estimatedPomodoros}
        label={`${task.completedPomodoros} de ${task.estimatedPomodoros} pomodoros`}
      />
      <p className={styles.caption}>
        {task.completedPomodoros} de {task.estimatedPomodoros} pomodoros
      </p>
    </section>
  )
}
