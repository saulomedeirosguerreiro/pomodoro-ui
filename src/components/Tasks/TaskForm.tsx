import { useState, type FormEvent } from 'react'
import { Button } from '../common/Button'
import { FormField } from '../common/FormField'
import { SegmentedControl } from '../common/SegmentedControl'
import type { TaskPayload } from '../../lib/tasksService'
import type { TaskItem, TaskPriority } from '../../types/api'

const PRIORITY_OPTIONS: { value: TaskPriority; label: string }[] = [
  { value: 'baixa', label: 'Baixa' },
  { value: 'media', label: 'Média' },
  { value: 'alta', label: 'Alta' },
]

interface TaskFormProps {
  initial?: TaskItem
  onSubmit: (payload: TaskPayload) => Promise<void>
  onCancel: () => void
}

export function TaskForm({ initial, onSubmit, onCancel }: TaskFormProps) {
  const [title, setTitle] = useState(initial?.title ?? '')
  const [description, setDescription] = useState(initial?.description ?? '')
  const [priority, setPriority] = useState<TaskPriority>(initial?.priority ?? 'media')
  const [estimatedPomodoros, setEstimatedPomodoros] = useState(initial?.estimatedPomodoros ?? 1)
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setError(null)
    setIsSubmitting(true)
    try {
      await onSubmit({
        title,
        description: description.trim() === '' ? null : description,
        priority,
        estimatedPomodoros,
      })
    } catch {
      setError('Não foi possível salvar a tarefa. Tente novamente.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form
      className="flex flex-col gap-2 rounded-lg border border-border bg-bg-subtle p-4"
      onSubmit={handleSubmit}
      noValidate
    >
      {error && (
        <p className="text-style-body-sm text-danger" role="alert">
          {error}
        </p>
      )}
      <FormField
        label="Título"
        name="title"
        required
        maxLength={120}
        value={title}
        onChange={(e) => setTitle(e.target.value)}
      />
      <FormField
        label="Descrição (opcional)"
        name="description"
        maxLength={500}
        value={description}
        onChange={(e) => setDescription(e.target.value)}
      />
      <div>
        <span className="mb-1 block text-style-label-sm text-text-muted">Prioridade</span>
        <SegmentedControl ariaLabel="Prioridade" options={PRIORITY_OPTIONS} value={priority} onChange={setPriority} />
      </div>
      <FormField
        label="Estimativa de pomodoros"
        name="estimatedPomodoros"
        type="number"
        min={1}
        max={20}
        required
        value={estimatedPomodoros}
        onChange={(e) => setEstimatedPomodoros(Number(e.target.value))}
      />
      <div className="flex justify-end gap-2">
        <Button type="button" variant="ghost" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Salvando…' : 'Salvar'}
        </Button>
      </div>
    </form>
  )
}
