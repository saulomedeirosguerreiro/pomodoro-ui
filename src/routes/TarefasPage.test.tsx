import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import * as TimerContextModule from '../context/TimerContext'
import type { DataSource } from '../lib/dataSource'
import { buildMockDataSource, DATA_SOURCE_MODES, mockUseDataSource } from '../test/dataSourceMocks'
import type { TaskItem } from '../types/api'
import { TarefasPage } from './TarefasPage'

function buildTask(overrides: Partial<TaskItem> = {}): TaskItem {
  return {
    id: 1,
    title: 'Relatório mensal',
    description: 'Fechar números do mês',
    priority: 'media',
    estimatedPomodoros: 4,
    completedPomodoros: 1,
    status: 'a_fazer',
    createdAt: '2026-01-01T10:00:00Z',
    updatedAt: '2026-01-01T10:00:00Z',
    ...overrides,
  }
}

const refreshFocusedTask = vi.fn()

describe.each(DATA_SOURCE_MODES)('TarefasPage (mode: %s)', (mode) => {
  let dataSource: DataSource

  beforeEach(() => {
    dataSource = buildMockDataSource()
    mockUseDataSource(dataSource, mode)

    vi.spyOn(TimerContextModule, 'useTimerContext').mockReturnValue({
      type: 'foco',
      phase: 'parado',
      remainingSeconds: 1500,
      totalSeconds: 1500,
      canFinalize: false,
      start: vi.fn(),
      pause: vi.fn(),
      resume: vi.fn(),
      restart: vi.fn(),
      finalize: vi.fn(),
      selectType: vi.fn(),
      skip: vi.fn(),
      lastRegisteredSession: null,
      registrationError: null,
      retryRegistration: vi.fn(),
      progress: null,
      rewardToast: null,
      dismissRewardToast: vi.fn(),
      focusedTask: null,
      refreshFocusedTask,
      achievementToast: null,
      dismissAchievementToast: vi.fn(),
      events: [],
      markEventsSeen: vi.fn(),
    })
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('mostra estado vazio quando não há tarefas', async () => {
    vi.mocked(dataSource.listTasks).mockResolvedValue([])

    render(<TarefasPage />)

    expect(await screen.findByText('Nenhuma tarefa encontrada.')).toBeInTheDocument()
  })

  it('lista as tarefas vindas do dataSource', async () => {
    vi.mocked(dataSource.listTasks).mockResolvedValue([buildTask()])

    render(<TarefasPage />)

    expect(await screen.findByText('Relatório mensal')).toBeInTheDocument()
    expect(screen.getByText('Fechar números do mês')).toBeInTheDocument()
    expect(screen.getByText('1/4 🍅')).toBeInTheDocument()
  })

  it('filtrar por status busca novamente com o status escolhido', async () => {
    vi.mocked(dataSource.listTasks).mockResolvedValue([])
    render(<TarefasPage />)
    await screen.findByText('Nenhuma tarefa encontrada.')

    await userEvent.click(screen.getByRole('tab', { name: 'Feito' }))

    expect(dataSource.listTasks).toHaveBeenLastCalledWith('feito')
  })

  it('cria uma nova tarefa pelo formulário', async () => {
    vi.mocked(dataSource.listTasks).mockResolvedValue([])
    vi.mocked(dataSource.createTask).mockResolvedValue(buildTask())
    render(<TarefasPage />)
    await screen.findByText('Nenhuma tarefa encontrada.')

    await userEvent.click(screen.getByRole('button', { name: '+ Nova Tarefa' }))
    await userEvent.type(screen.getByLabelText('Título'), 'Nova tarefa')
    await userEvent.click(screen.getByRole('button', { name: 'Salvar' }))

    expect(dataSource.createTask).toHaveBeenCalledWith({
      title: 'Nova tarefa',
      description: null,
      priority: 'media',
      estimatedPomodoros: 1,
    })
  })

  it('"Focar nesta" chama setTaskStatus com em_curso e atualiza a tarefa em foco do timer', async () => {
    vi.mocked(dataSource.listTasks).mockResolvedValue([buildTask()])
    vi.mocked(dataSource.setTaskStatus).mockResolvedValue(buildTask({ status: 'em_curso' }))
    render(<TarefasPage />)
    await screen.findByText('Relatório mensal')

    await userEvent.click(screen.getByRole('button', { name: 'Focar nesta' }))

    expect(dataSource.setTaskStatus).toHaveBeenCalledWith(1, 'em_curso')
    expect(refreshFocusedTask).toHaveBeenCalled()
  })

  it('"Marcar como feita" chama setTaskStatus com feito', async () => {
    vi.mocked(dataSource.listTasks).mockResolvedValue([buildTask()])
    vi.mocked(dataSource.setTaskStatus).mockResolvedValue(buildTask({ status: 'feito' }))
    render(<TarefasPage />)
    await screen.findByText('Relatório mensal')

    await userEvent.click(screen.getByRole('button', { name: 'Marcar como feita' }))

    expect(dataSource.setTaskStatus).toHaveBeenCalledWith(1, 'feito')
  })

  it('"Excluir" chama removeTask', async () => {
    vi.mocked(dataSource.listTasks).mockResolvedValue([buildTask()])
    vi.mocked(dataSource.removeTask).mockResolvedValue(undefined)
    render(<TarefasPage />)
    await screen.findByText('Relatório mensal')

    await userEvent.click(screen.getByRole('button', { name: 'Excluir' }))

    expect(dataSource.removeTask).toHaveBeenCalledWith(1)
  })

  it('"Editar" abre o formulário preenchido e salvar chama updateTask', async () => {
    vi.mocked(dataSource.listTasks).mockResolvedValue([buildTask()])
    vi.mocked(dataSource.updateTask).mockResolvedValue(buildTask({ title: 'Relatório revisado' }))
    render(<TarefasPage />)
    await screen.findByText('Relatório mensal')

    await userEvent.click(screen.getByRole('button', { name: 'Editar' }))
    const titleInput = screen.getByLabelText('Título')
    await userEvent.clear(titleInput)
    await userEvent.type(titleInput, 'Relatório revisado')
    await userEvent.click(screen.getByRole('button', { name: 'Salvar' }))

    expect(dataSource.updateTask).toHaveBeenCalledWith(1, {
      title: 'Relatório revisado',
      description: 'Fechar números do mês',
      priority: 'media',
      estimatedPomodoros: 4,
    })
  })
})
