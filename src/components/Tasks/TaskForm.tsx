import { useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '../common/Button'
import { FormField } from '../common/FormField'
import { SegmentedControl } from '../common/SegmentedControl'
import type { TaskPayload } from '../../lib/tasksService'
import type { TaskItem, TaskPriority } from '../../types/api'

const PRIORITY_VALUES: TaskPriority[] = ['baixa', 'media', 'alta']

interface TaskFormProps {
  initial?: TaskItem
  onSubmit: (payload: TaskPayload) => Promise<void>
  onCancel: () => void
}

export function TaskForm({ initial, onSubmit, onCancel }: TaskFormProps) {
  const { t } = useTranslation('tasks')
  const PRIORITY_OPTIONS: { value: TaskPriority; label: string }[] = PRIORITY_VALUES.map((value) => ({
    value,
    label: t(`priority.${value}`),
  }))
  const [title, setTitle] = useState(initial?.title ?? '')
  const [description, setDescription] = useState(initial?.description ?? '')
  const [priority, setPriority] = useState<TaskPriority>(initial?.priority ?? 'media')
  // Texto cru do input, não number: guardar `Number(e.target.value)` a cada tecla faz o estado ir e
  // voltar pelo input a cada render, e o input type="number" exibe esse round-trip como dígitos extras
  // (ex.: digitar "3" vira "03") porque o cursor/valor nativo já tinha avançado antes do React
  // reconciliar. Convertendo só no submit, o campo fica livre pra digitar sem interferência.
  const [estimatedPomodorosText, setEstimatedPomodorosText] = useState(String(initial?.estimatedPomodoros ?? 1))
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
        estimatedPomodoros: Number(estimatedPomodorosText),
      })
    } catch {
      setError(t('form.error'))
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
        label={t('form.titleLabel')}
        name="title"
        required
        maxLength={120}
        value={title}
        onChange={(e) => setTitle(e.target.value)}
      />
      <FormField
        label={t('form.descriptionLabel')}
        name="description"
        maxLength={500}
        value={description}
        onChange={(e) => setDescription(e.target.value)}
      />
      <div>
        <span className="mb-1 block text-style-label-sm text-text-muted">{t('form.priorityLabel')}</span>
        <SegmentedControl
          ariaLabel={t('form.priorityLabel')}
          options={PRIORITY_OPTIONS}
          value={priority}
          onChange={setPriority}
        />
      </div>
      <FormField
        label={t('form.estimatedPomodorosLabel')}
        name="estimatedPomodoros"
        type="number"
        min={1}
        max={20}
        required
        value={estimatedPomodorosText}
        onChange={(e) => setEstimatedPomodorosText(e.target.value)}
      />
      <div className="flex flex-wrap justify-end gap-2">
        <Button type="button" variant="ghost" onClick={onCancel}>
          {t('form.cancel')}
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? t('form.saving') : t('form.save')}
        </Button>
      </div>
    </form>
  )
}
