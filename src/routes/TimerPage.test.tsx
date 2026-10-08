import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import * as TimerContextModule from '../context/TimerContext'
import { SettingsProvider } from '../context/SettingsContext'
import { pomodorosService } from '../lib/pomodorosService'
import { tasksService } from '../lib/tasksService'
import type { TaskItem } from '../types/api'
import { TimerPage } from './TimerPage'

function renderTimerPage() {
  return render(
    <SettingsProvider>
      <TimerPage />
    </SettingsProvider>,
  )
}

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

vi.mock('../lib/pomodorosService', () => ({
  pomodorosService: {
    list: vi.fn(),
    create: vi.fn(),
  },
}))

vi.mock('../lib/tasksService', () => ({
  tasksService: {
    list: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    setStatus: vi.fn(),
    remove: vi.fn(),
  },
}))

function mockTimer(overrides?: Partial<ReturnType<typeof TimerContextModule.useTimerContext>>) {
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
    refreshFocusedTask: vi.fn(),
    achievementToast: null,
    dismissAchievementToast: vi.fn(),
    events: [],
    markEventsSeen: vi.fn(),
    ...overrides,
  })
}

describe('TimerPage', () => {
  beforeEach(() => {
    vi.mocked(pomodorosService.list).mockResolvedValue({ items: [], totalCount: 0, limit: 10, offset: 0 })
    vi.mocked(tasksService.list).mockResolvedValue([])
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('renderiza o timer parado em Foco 25:00', async () => {
    mockTimer()
    renderTimerPage()

    expect(screen.getByText('25:00')).toBeInTheDocument()
    expect(screen.getByText('Foco')).toBeInTheDocument()

    await waitFor(() => expect(pomodorosService.list).toHaveBeenCalled())
  })

  it('clicar em "Começar Foco" aciona o início do timer', async () => {
    const start = vi.fn()
    mockTimer({ start })
    renderTimerPage()

    await userEvent.click(screen.getByRole('button', { name: 'Começar Foco' }))

    expect(start).toHaveBeenCalledTimes(1)
  })

  it('enquanto rodando, mostra o botão Pausar', () => {
    mockTimer({ phase: 'rodando', canFinalize: true })
    renderTimerPage()

    expect(screen.getByRole('button', { name: 'Pausar' })).toBeInTheDocument()
  })

  it('exibe o jardim de hoje com base no progresso', () => {
    mockTimer({
      progress: {
        level: 1,
        title: 'Semente Curiosa',
        xpInLevel: 0,
        xpForNextLevel: 200,
        totalXp: 0,
        seeds: 0,
        streakDays: 0,
        isStreakAtRiskToday: true,
        todayFocusCount: 2,
        todayFocusSeconds: 3000,
      },
    })

    renderTimerPage()

    expect(screen.getByText('2 colheitas')).toBeInTheDocument()
    expect(screen.getByText('Tomatinho')).toBeInTheDocument()
    expect(screen.getByText('Moranguinho')).toBeInTheDocument()
  })

  it('mostra erro de registro com botão de tentar novamente', async () => {
    const retryRegistration = vi.fn()
    mockTimer({ registrationError: 'Não foi possível registrar a sessão. Seus dados não foram perdidos.', retryRegistration })
    renderTimerPage()

    await userEvent.click(screen.getByRole('button', { name: 'Tentar novamente' }))

    expect(retryRegistration).toHaveBeenCalledTimes(1)
  })

  it('exibe a Missão do Momento com a tarefa em foco e o checklist com as tarefas pendentes', async () => {
    vi.mocked(tasksService.list).mockResolvedValue([buildTask({ status: 'em_curso' })])
    mockTimer()

    renderTimerPage()

    await screen.findByRole('checkbox', { name: 'Relatório mensal' })
    expect(screen.getAllByText('Relatório mensal')).toHaveLength(2)
    expect(screen.getByText('Em foco')).toBeInTheDocument()
    expect(screen.getByText('1 de 4 pomodoros')).toBeInTheDocument()
  })

  it('"Focar nesta" no checklist chama tasksService.setStatus e atualiza a tarefa em foco do timer', async () => {
    const refreshFocusedTask = vi.fn()
    vi.mocked(tasksService.list).mockResolvedValue([buildTask()])
    vi.mocked(tasksService.setStatus).mockResolvedValue(buildTask({ status: 'em_curso' }))
    mockTimer({ refreshFocusedTask })

    renderTimerPage()
    await screen.findByText('Relatório mensal')

    await userEvent.click(screen.getByRole('button', { name: 'Focar nesta' }))

    expect(tasksService.setStatus).toHaveBeenCalledWith(1, 'em_curso')
    await waitFor(() => expect(refreshFocusedTask).toHaveBeenCalled())
  })

  it('marcar uma tarefa como concluída no checklist chama tasksService.setStatus com feito', async () => {
    vi.mocked(tasksService.list).mockResolvedValue([buildTask()])
    vi.mocked(tasksService.setStatus).mockResolvedValue(buildTask({ status: 'feito' }))
    mockTimer()

    renderTimerPage()
    await screen.findByText('Relatório mensal')

    await userEvent.click(screen.getByRole('checkbox', { name: 'Relatório mensal' }))

    expect(tasksService.setStatus).toHaveBeenCalledWith(1, 'feito')
  })
})
