import { useCallback, useEffect, useState } from 'react'
import { Badge } from '../components/common/Badge'
import { Button } from '../components/common/Button'
import { SegmentedControl } from '../components/common/SegmentedControl'
import { TaskForm } from '../components/Tasks/TaskForm'
import { useTimerContext } from '../context/TimerContext'
import { tasksService, type TaskPayload } from '../lib/tasksService'
import type { TaskItem, TaskItemStatus } from '../types/api'
import styles from './TarefasPage.module.css'

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

  const [filter, setFilter] = useState<'todas' | TaskItemStatus>('todas')
  const [tasks, setTasks] = useState<TaskItem[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isCreating, setIsCreating] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)

  const load = useCallback(async (status: 'todas' | TaskItemStatus) => {
    try {
      const items = await tasksService.list(status === 'todas' ? undefined : status)
      setError(null)
      setTasks(items)
    } catch {
      setError('Não foi possível carregar as tarefas.')
    }
  }, [])

  useEffect(() => {
    load(filter)
  }, [filter, load])

  async function handleCreate(payload: TaskPayload) {
    await tasksService.create(payload)
    setIsCreating(false)
    await load(filter)
  }

  async function handleUpdate(id: number, payload: TaskPayload) {
    await tasksService.update(id, payload)
    setEditingId(null)
    await load(filter)
  }

  async function handleSetStatus(task: TaskItem, status: TaskItemStatus) {
    await tasksService.setStatus(task.id, status)
    await load(filter)
    if (status === 'em_curso' || task.status === 'em_curso') {
      timer.refreshFocusedTask()
    }
  }

  async function handleDelete(task: TaskItem) {
    await tasksService.remove(task.id)
    await load(filter)
    if (task.status === 'em_curso') {
      timer.refreshFocusedTask()
    }
  }

  return (
    <div className={styles.page}>
      <h1>Tarefas</h1>

      <div className={styles.toolbar}>
        <SegmentedControl ariaLabel="Filtrar por status" options={FILTER_OPTIONS} value={filter} onChange={setFilter} />
        {!isCreating && <Button onClick={() => setIsCreating(true)}>+ Nova Tarefa</Button>}
      </div>

      {error && <p className={styles.error}>{error}</p>}

      {isCreating && <TaskForm onSubmit={handleCreate} onCancel={() => setIsCreating(false)} />}

      {tasks !== null && tasks.length === 0 && !isCreating && (
        <p className={styles.empty}>Nenhuma tarefa encontrada.</p>
      )}

      <ul className={styles.list}>
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
            <li key={task.id} className={styles.item}>
              <div className={styles.itemHeader}>
                <h3>{task.title}</h3>
                <Badge variant={task.status === 'em_curso' ? 'tertiary' : 'neutral'}>
                  {STATUS_LABEL[task.status]}
                </Badge>
              </div>
              {task.description && <p className={styles.description}>{task.description}</p>}
              <div className={styles.meta}>
                <Badge variant="neutral">{PRIORITY_LABEL[task.priority]}</Badge>
                <span className={styles.count}>
                  {task.completedPomodoros}/{task.estimatedPomodoros} 🍅
                </span>
              </div>
              <div className={styles.actions}>
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
