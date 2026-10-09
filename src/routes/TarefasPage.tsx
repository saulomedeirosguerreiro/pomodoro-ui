import { useCallback, useEffect, useState } from 'react'
import { Badge } from '../components/common/Badge'
import { Button } from '../components/common/Button'
import { SegmentedControl } from '../components/common/SegmentedControl'
import { TaskForm } from '../components/Tasks/TaskForm'
import { useDataSource } from '../context/DataSourceContext'
import { useTimerContext } from '../context/TimerContext'
import type { TaskPayload } from '../lib/tasksService'
import type { TaskItem, TaskItemStatus } from '../types/api'

const PRIORITY_LABEL: Record<TaskItem['priority'], string> = {
  baixa: 'Baixa',
  media: 'Média',
  alta: 'Alta',
}

const STATUS_LABEL: Record<TaskItemStatus, string> = {
  a_fazer: 'A fazer',
  em_curso: 'Em curso',
  feito: 'Feito',
}

const FILTER_OPTIONS: { value: 'todas' | TaskItemStatus; label: string }[] = [
  { value: 'todas', label: 'Todas' },
  { value: 'a_fazer', label: 'A fazer' },
  { value: 'em_curso', label: 'Em curso' },
  { value: 'feito', label: 'Feito' },
]

export function TarefasPage() {
  const timer = useTimerContext()
  const { dataSource } = useDataSource()

  const [filter, setFilter] = useState<'todas' | TaskItemStatus>('todas')
  const [tasks, setTasks] = useState<TaskItem[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isCreating, setIsCreating] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)

  const load = useCallback(
    async (status: 'todas' | TaskItemStatus) => {
      if (!dataSource) return
      try {
        const items = await dataSource.listTasks(status === 'todas' ? undefined : status)
        setError(null)
        setTasks(items)
      } catch {
        setError('Não foi possível carregar as tarefas.')
      }
    },
    [dataSource],
  )

  useEffect(() => {
    load(filter)
  }, [filter, load])

  async function handleCreate(payload: TaskPayload) {
    if (!dataSource) return
    await dataSource.createTask(payload)
    setIsCreating(false)
    await load(filter)
  }

  async function handleUpdate(id: number, payload: TaskPayload) {
    if (!dataSource) return
    await dataSource.updateTask(id, payload)
    setEditingId(null)
    await load(filter)
  }

  async function handleSetStatus(task: TaskItem, status: TaskItemStatus) {
    if (!dataSource) return
    await dataSource.setTaskStatus(task.id, status)
    await load(filter)
    if (status === 'em_curso' || task.status === 'em_curso') {
      timer.refreshFocusedTask()
    }
  }

  async function handleDelete(task: TaskItem) {
    if (!dataSource) return
    await dataSource.removeTask(task.id)
    await load(filter)
    if (task.status === 'em_curso') {
      timer.refreshFocusedTask()
    }
  }

  return (
    <div className="mx-auto flex max-w-[720px] flex-col gap-4">
      <h1>Tarefas</h1>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <SegmentedControl ariaLabel="Filtrar por status" options={FILTER_OPTIONS} value={filter} onChange={setFilter} />
        {!isCreating && <Button onClick={() => setIsCreating(true)}>+ Nova Tarefa</Button>}
      </div>

      {error && <p className="text-style-body-sm text-danger">{error}</p>}

      {isCreating && <TaskForm onSubmit={handleCreate} onCancel={() => setIsCreating(false)} />}

      {tasks !== null && tasks.length === 0 && !isCreating && (
        <p className="text-style-body-sm text-text-muted">Nenhuma tarefa encontrada.</p>
      )}

      <ul className="flex list-none flex-col gap-2 m-0 p-0">
        {(tasks ?? []).map((task) =>
          editingId === task.id ? (
            <li key={task.id}>
              <TaskForm
                initial={task}
                onSubmit={(payload) => handleUpdate(task.id, payload)}
                onCancel={() => setEditingId(null)}
              />
            </li>
          ) : (
            <li
              key={task.id}
              className="flex flex-col gap-2 rounded-2xl border border-border bg-surface p-4 shadow-card"
            >
              <div className="flex items-center justify-between gap-2">
                <h3 className="min-w-0 break-words text-style-label-md text-text-h">{task.title}</h3>
                <Badge variant={task.status === 'em_curso' ? 'tertiary' : 'neutral'}>
                  {STATUS_LABEL[task.status]}
                </Badge>
              </div>
              {task.description && <p className="text-style-body-sm text-text-muted">{task.description}</p>}
              <div className="flex items-center gap-2">
                <Badge variant="neutral">{PRIORITY_LABEL[task.priority]}</Badge>
                <span className="text-style-label-sm text-text-muted">
                  {task.completedPomodoros}/{task.estimatedPomodoros} 🍅
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {task.status !== 'em_curso' && task.status !== 'feito' && (
                  <Button variant="ghost" onClick={() => handleSetStatus(task, 'em_curso')}>
                    Focar nesta
                  </Button>
                )}
                {task.status !== 'feito' && (
                  <Button variant="ghost" onClick={() => handleSetStatus(task, 'feito')}>
                    Marcar como feita
                  </Button>
                )}
                {task.status === 'feito' && (
                  <Button variant="ghost" onClick={() => handleSetStatus(task, 'a_fazer')}>
                    Reabrir
                  </Button>
                )}
                <Button variant="ghost" onClick={() => setEditingId(task.id)}>
                  Editar
                </Button>
                <Button variant="ghost" onClick={() => handleDelete(task)}>
                  Excluir
                </Button>
              </div>
            </li>
          ),
        )}
      </ul>
    </div>
  )
}
