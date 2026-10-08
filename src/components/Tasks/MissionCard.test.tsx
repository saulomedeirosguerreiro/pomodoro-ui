import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import type { TaskItem } from '../../types/api'
import { MissionCard } from './MissionCard'

function buildTask(overrides: Partial<TaskItem> = {}): TaskItem {
  return {
    id: 1,
    title: 'Relatório mensal',
    description: null,
    priority: 'media',
    estimatedPomodoros: 4,
    completedPomodoros: 1,
    status: 'em_curso',
    createdAt: '2026-01-01T10:00:00Z',
    updatedAt: '2026-01-01T10:00:00Z',
    ...overrides,
  }
}

describe('MissionCard', () => {
  it('sem tarefa em foco, mostra mensagem para escolher uma', () => {
    render(<MissionCard task={null} />)

    expect(screen.getByText(/escolha uma tarefa/i)).toBeInTheDocument()
  })

  it('com tarefa em foco, mostra título e progresso de pomodoros', () => {
    render(<MissionCard task={buildTask()} />)

    expect(screen.getByText('Relatório mensal')).toBeInTheDocument()
    expect(screen.getByText('1 de 4 pomodoros')).toBeInTheDocument()
  })
})
