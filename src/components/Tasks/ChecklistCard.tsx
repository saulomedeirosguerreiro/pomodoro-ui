import { useState } from 'react'
import { Badge } from '../common/Badge'
import { Button } from '../common/Button'
import { Checkbox } from '../common/Checkbox'
import { LofiPlayer } from '../Sound/LofiPlayer'
import { TaskForm } from './TaskForm'
import type { TaskPayload } from '../../lib/tasksService'
import type { TaskItem } from '../../types/api'
import styles from './ChecklistCard.module.css'

const PRIORITY_LABEL: Record<TaskItem['priority'], string> = {
  baixa: 'Baixa',
  media: 'Média',
  alta: 'Alta',
}

export interface ChecklistCardProps {
  tasks: TaskItem[] | null
  error: string | null
  onCreate: (payload: TaskPayload) => Promise<void>
  onMarkDone: (task: TaskItem) => Promise<void>
  onFocus: (task: TaskItem) => Promise<void>
}

export function ChecklistCard({ tasks, error, onCreate, onMarkDone, onFocus }: ChecklistCardProps) {
  const [isCreating, setIsCreating] = useState(false)

  const openTasks = (tasks ?? []).filter((t) => t.status !== 'feito')

  async function handleCreate(payload: TaskPayload) {
    await onCreate(payload)
    setIsCreating(false)
  }

  return (
    <section className={styles.card}>
      <div className={styles.header}>
        <h2>✅ Checklist de Foco</h2>
        {!isCreating && (
          <Button variant="ghost" onClick={() => setIsCreating(true)}>
            + Nova Tarefa
          </Button>
        )}
      </div>

      {error && <p className={styles.error}>{error}</p>}

      {isCreating && <TaskForm onSubmit={handleCreate} onCancel={() => setIsCreating(false)} />}

      {openTasks.length === 0 && !isCreating ? (
        <p className={styles.empty}>Nenhuma tarefa pendente. Que tal criar a primeira?</p>
      ) : (
        <ul className={styles.list}>
          {openTasks.map((task) => (
            <li key={task.id} className={styles.item}>
              <Checkbox checked={false} onChange={() => onMarkDone(task)} label={task.title} />
              <div className={styles.meta}>
                <Badge variant="neutral">{PRIORITY_LABEL[task.priority]}</Badge>
                <span className={styles.count}>
                  {task.completedPomodoros}/{task.estimatedPomodoros} 🍅
                </span>
                {task.status === 'em_curso' ? (
                  <Badge variant="tertiary">Em foco</Badge>
                ) : (
                  <Button variant="ghost" onClick={() => onFocus(task)}>
                    Focar nesta
                  </Button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}

      <LofiPlayer />
    </section>
  )
}
