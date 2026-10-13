import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Badge } from '../common/Badge'
import { Button } from '../common/Button'
import { Checkbox } from '../common/Checkbox'
import { TaskForm } from './TaskForm'
import type { TaskPayload } from '../../lib/tasksService'
import type { TaskItem } from '../../types/api'

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
    <section className="flex w-full flex-col gap-2 rounded-2xl border border-border bg-surface p-4 shadow-card">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-style-headline-sm">✅ Checklist de Foco</h2>
        <div className="flex items-center gap-3">
          <Link
            to="/tarefas"
            className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-full border-2 border-border bg-bg-subtle px-6 py-3 text-style-label-lg text-text-h transition-[transform,box-shadow] duration-150 ease-out active:translate-y-0.5"
          >
            Ver todas
          </Link>
          {!isCreating && (
            <Button variant="ghost" onClick={() => setIsCreating(true)}>
              + Nova Tarefa
            </Button>
          )}
        </div>
      </div>

      {error && <p className="text-style-body-sm text-danger">{error}</p>}

      {isCreating && <TaskForm onSubmit={handleCreate} onCancel={() => setIsCreating(false)} />}

      {openTasks.length === 0 && !isCreating ? (
        <p className="text-style-body-sm text-text-muted">Nenhuma tarefa pendente. Que tal criar a primeira?</p>
      ) : (
        <ul className="m-0 flex list-none flex-col gap-2 p-0">
          {openTasks.map((task) => (
            <li
              key={task.id}
              className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border bg-bg-subtle p-2"
            >
              <Checkbox checked={false} onChange={() => onMarkDone(task)} label={task.title} />
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="neutral">{PRIORITY_LABEL[task.priority]}</Badge>
                <span className="text-style-label-sm text-text-muted">
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
    </section>
  )
}
