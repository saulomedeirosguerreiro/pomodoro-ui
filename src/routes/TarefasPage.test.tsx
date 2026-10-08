import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import * as TimerContextModule from '../context/TimerContext'
import { tasksService } from '../lib/tasksService'
import type { TaskItem } from '../types/api'
import { TarefasPage } from './TarefasPage'

vi.mock('../lib/tasksService', () => ({
  tasksService: {
    list: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    setStatus: vi.fn(),
    remove: vi.fn(),
  },
}))

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

describe('TarefasPage', () => {
  beforeEach(() => {
    vi.spyOn(TimerContextModule, 'useTimerContext').mockReturnValue({
      type: 'foco',
      phase: 'parado',
      remainingSeconds: 1500,
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
    vi.mocked(tasksService.list).mockResolvedValue([])

    render(<TarefasPage />)

    expect(await screen.findByText('Nenhuma tarefa encontrada.')).toBeInTheDocument()
  })

  it('lista as tarefas vindas da API', async () => {
    vi.mocked(tasksService.list).mockResolvedValue([buildTask()])

    render(<TarefasPage />)

    expect(await screen.findByText('Relatório mensal')).toBeInTheDocument()
    expect(screen.getByText('Fechar números do mês')).toBeInTheDocument()
    expect(screen.getByText('1/4 🍅')).toBeInTheDocument()
  })

  it('filtrar por status busca novamente com o status escolhido', async () => {
    vi.mocked(tasksService.list).mockResolvedValue([])
    render(<TarefasPage />)
    await screen.findByText('Nenhuma tarefa encontrada.')

    await userEvent.click(screen.getByRole('tab', { name: 'Feito' }))

    expect(tasksService.list).toHaveBeenLastCalledWith('feito')
  })

  it('cria uma nova tarefa pelo formulário', async () => {
    vi.mocked(tasksService.list).mockResolvedValue([])
    vi.mocked(tasksService.create).mockResolvedValue(buildTask())
    render(<TarefasPage />)
    await screen.findByText('Nenhuma tarefa encontrada.')

    await userEvent.click(screen.getByRole('button', { name: '+ Nova Tarefa' }))
    await userEvent.type(screen.getByLabelText('Título'), 'Nova tarefa')
    await userEvent.click(screen.getByRole('button', { name: 'Salvar' }))

    expect(tasksService.create).toHaveBeenCalledWith({
      title: 'Nova tarefa',
      description: null,
      priority: 'media',
      estimatedPomodoros: 1,
    })
  })

  it('"Focar nesta" chama setStatus com em_curso e atualiza a tarefa em foco do timer', async () => {
    vi.mocked(tasksService.list).mockResolvedValue([buildTask()])
    vi.mocked(tasksService.setStatus).mockResolvedValue(buildTask({ status: 'em_curso' }))
    render(<TarefasPage />)
    await screen.findByText('Relatório mensal')

    await userEvent.click(screen.getByRole('button', { name: 'Focar nesta' }))

    expect(tasksService.setStatus).toHaveBeenCalledWith(1, 'em_curso')
    expect(refreshFocusedTask).toHaveBeenCalled()
  })

  it('"Marcar como feita" chama setStatus com feito', async () => {
    vi.mocked(tasksService.list).mockResolvedValue([buildTask()])
    vi.mocked(tasksService.setStatus).mockResolvedValue(buildTask({ status: 'feito' }))
    render(<TarefasPage />)
    await screen.findByText('Relatório mensal')

    await userEvent.click(screen.getByRole('button', { name: 'Marcar como feita' }))

    expect(tasksService.setStatus).toHaveBeenCalledWith(1, 'feito')
  })

  it('"Excluir" chama remove', async () => {
    vi.mocked(tasksService.list).mockResolvedValue([buildTask()])
    vi.mocked(tasksService.remove).mockResolvedValue(undefined)
    render(<TarefasPage />)
    await screen.findByText('Relatório mensal')

    await userEvent.click(screen.getByRole('button', { name: 'Excluir' }))

    expect(tasksService.remove).toHaveBeenCalledWith(1)
  })

  it('"Editar" abre o formulário preenchido e salvar chama update', async () => {
    vi.mocked(tasksService.list).mockResolvedValue([buildTask()])
    vi.mocked(tasksService.update).mockResolvedValue(buildTask({ title: 'Relatório revisado' }))
    render(<TarefasPage />)
    await screen.findByText('Relatório mensal')

    await userEvent.click(screen.getByRole('button', { name: 'Editar' }))
    const titleInput = screen.getByLabelText('Título')
    await userEvent.clear(titleInput)
    await userEvent.type(titleInput, 'Relatório revisado')
    await userEvent.click(screen.getByRole('button', { name: 'Salvar' }))

    expect(tasksService.update).toHaveBeenCalledWith(1, {
      title: 'Relatório revisado',
      description: 'Fechar números do mês',
      priority: 'media',
      estimatedPomodoros: 4,
    })
  })
})
