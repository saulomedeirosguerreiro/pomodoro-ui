import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { SettingsProvider } from '../../context/SettingsContext'
import type { TaskItem } from '../../types/api'
import { ChecklistCard, type ChecklistCardProps } from './ChecklistCard'

function buildTask(overrides: Partial<TaskItem> = {}): TaskItem {
  return {
    id: 1,
    title: 'Relatório mensal',
    description: null,
    priority: 'media',
    estimatedPomodoros: 4,
    completedPomodoros: 1,
    status: 'a_fazer',
    createdAt: '2026-01-01T10:00:00Z',
    updatedAt: '2026-01-01T10:00:00Z',
    ...overrides,
  }
}

function renderCard(props: ChecklistCardProps) {
  return render(
    <SettingsProvider>
      <ChecklistCard {...props} />
    </SettingsProvider>,
  )
}

describe('ChecklistCard', () => {
  it('mostra estado vazio quando não há tarefas pendentes', () => {
    renderCard({ tasks: [], error: null, onCreate: vi.fn(), onMarkDone: vi.fn(), onFocus: vi.fn() })

    expect(screen.getByText(/nenhuma tarefa pendente/i)).toBeInTheDocument()
  })

  it('exibe erro quando informado', () => {
    renderCard({
      tasks: [],
      error: 'Não foi possível carregar as tarefas.',
      onCreate: vi.fn(),
      onMarkDone: vi.fn(),
      onFocus: vi.fn(),
    })

    expect(screen.getByText('Não foi possível carregar as tarefas.')).toBeInTheDocument()
  })

  it('esconde tarefas com status feito', () => {
    renderCard({
      tasks: [buildTask({ id: 1, title: 'Pendente' }), buildTask({ id: 2, title: 'Concluída', status: 'feito' })],
      error: null,
      onCreate: vi.fn(),
      onMarkDone: vi.fn(),
      onFocus: vi.fn(),
    })

    expect(screen.getByText('Pendente')).toBeInTheDocument()
    expect(screen.queryByText('Concluída')).not.toBeInTheDocument()
  })

  it('tarefa em foco mostra badge "Em foco" em vez do botão Focar', () => {
    renderCard({
      tasks: [buildTask({ status: 'em_curso' })],
      error: null,
      onCreate: vi.fn(),
      onMarkDone: vi.fn(),
      onFocus: vi.fn(),
    })

    expect(screen.getByText('Em foco')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Focar nesta' })).not.toBeInTheDocument()
  })

  it('clicar em "Focar nesta" aciona onFocus com a tarefa', async () => {
    const onFocus = vi.fn()
    const task = buildTask()
    renderCard({ tasks: [task], error: null, onCreate: vi.fn(), onMarkDone: vi.fn(), onFocus })

    await userEvent.click(screen.getByRole('button', { name: 'Focar nesta' }))

    expect(onFocus).toHaveBeenCalledWith(task)
  })

  it('marcar o checkbox aciona onMarkDone com a tarefa', async () => {
    const onMarkDone = vi.fn()
    const task = buildTask()
    renderCard({ tasks: [task], error: null, onCreate: vi.fn(), onMarkDone, onFocus: vi.fn() })

    await userEvent.click(screen.getByRole('checkbox', { name: task.title }))

    expect(onMarkDone).toHaveBeenCalledWith(task)
  })

  it('"+ Nova Tarefa" abre o formulário e submeter cria a tarefa', async () => {
    const onCreate = vi.fn().mockResolvedValue(undefined)
    renderCard({ tasks: [], error: null, onCreate, onMarkDone: vi.fn(), onFocus: vi.fn() })

    await userEvent.click(screen.getByRole('button', { name: '+ Nova Tarefa' }))
    await userEvent.type(screen.getByLabelText('Título'), 'Nova tarefa')
    await userEvent.click(screen.getByRole('button', { name: 'Salvar' }))

    expect(onCreate).toHaveBeenCalledWith({
      title: 'Nova tarefa',
      description: null,
      priority: 'media',
      estimatedPomodoros: 1,
    })
  })
})
