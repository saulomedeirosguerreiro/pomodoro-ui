import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import * as FlexibleTimerContextModule from '../context/FlexibleTimerContext'
import * as TimerContextModule from '../context/TimerContext'
import { LofiPlayerProvider } from '../context/LofiPlayerContext'
import { SettingsProvider } from '../context/SettingsContext'
import { buildMockDataSource, DATA_SOURCE_MODES, mockUseDataSource } from '../test/dataSourceMocks'
import type { DataSource } from '../lib/dataSource'
import { trackEvent } from '../lib/analytics'
import type { TaskItem } from '../types/api'
import { TimerPage } from './TimerPage'

vi.mock('../lib/analytics', () => ({
  trackEvent: vi.fn(),
}))

function renderTimerPage() {
  return render(
    <SettingsProvider>
      <LofiPlayerProvider>
        <TimerPage />
      </LofiPlayerProvider>
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

function mockTimer(overrides?: Partial<ReturnType<typeof TimerContextModule.useTimerContext>>) {
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
    canRetryRegistration: true,
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

function mockFlexibleTimer(overrides?: Partial<ReturnType<typeof FlexibleTimerContextModule.useFlexibleTimerContext>>) {
  vi.spyOn(FlexibleTimerContextModule, 'useFlexibleTimerContext').mockReturnValue({
    phase: { kind: 'selecionando_foco' },
    draftMinutes: 5,
    totalSeconds: 0,
    remainingSeconds: 0,
    addedSeconds: 0,
    breakType: null,
    focusBlocksCompleted: 0,
    totalFocusSecondsCompleted: 0,
    chooseFocusPreset: vi.fn(),
    chooseFocusCustom: vi.fn(),
    startFocus: vi.fn(),
    pause: vi.fn(),
    resume: vi.fn(),
    addTime: vi.fn(),
    endCurrentBlockNow: vi.fn(),
    startBreak: vi.fn(),
    startAnotherFocus: vi.fn(),
    endSession: vi.fn(),
    chooseBreakPreset: vi.fn(),
    chooseBreakCustom: vi.fn(),
    backToFocusNow: vi.fn(),
    backToFocus: vi.fn(),
    startNewSession: vi.fn(),
    registrationError: null,
    retryRegistration: vi.fn(),
    canRetryRegistration: true,
    rewardToast: null,
    dismissRewardToast: vi.fn(),
    achievementToast: null,
    dismissAchievementToast: vi.fn(),
    progress: null,
    ...overrides,
  })
}

describe.each(DATA_SOURCE_MODES)('TimerPage (mode: %s)', (mode) => {
  let dataSource: DataSource

  beforeEach(() => {
    dataSource = buildMockDataSource()
    vi.mocked(dataSource.listSessions).mockResolvedValue({ items: [], totalCount: 0, limit: 10, offset: 0 })
    vi.mocked(dataSource.listTasks).mockResolvedValue([])
    mockUseDataSource(dataSource, mode)
    // `TimerPage` lê os dois contextos para travar o seletor de modo (ver describe abaixo) — default
    // parado/ocioso, sobrescrito explicitamente pelos testes que precisam de outro estado.
    mockFlexibleTimer()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('renderiza o timer parado em Foco 25:00', async () => {
    mockTimer()
    renderTimerPage()

    expect(screen.getByText('25:00')).toBeInTheDocument()
    expect(screen.getByText('Foco')).toBeInTheDocument()

    await waitFor(() => expect(dataSource.listSessions).toHaveBeenCalled())
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
    vi.mocked(dataSource.listTasks).mockResolvedValue([buildTask({ status: 'em_curso' })])
    mockTimer()

    renderTimerPage()

    await screen.findByRole('checkbox', { name: 'Relatório mensal' })
    expect(screen.getAllByText('Relatório mensal')).toHaveLength(2)
    expect(screen.getByText('Em foco')).toBeInTheDocument()
    expect(screen.getByText('1 de 4 pomodoros')).toBeInTheDocument()
  })

  it('"Focar nesta" no checklist chama dataSource.setTaskStatus e atualiza a tarefa em foco do timer', async () => {
    const refreshFocusedTask = vi.fn()
    vi.mocked(dataSource.listTasks).mockResolvedValue([buildTask()])
    vi.mocked(dataSource.setTaskStatus).mockResolvedValue(buildTask({ status: 'em_curso' }))
    mockTimer({ refreshFocusedTask })

    renderTimerPage()
    await screen.findByText('Relatório mensal')

    await userEvent.click(screen.getByRole('button', { name: 'Focar nesta' }))

    expect(dataSource.setTaskStatus).toHaveBeenCalledWith(1, 'em_curso')
    await waitFor(() => expect(refreshFocusedTask).toHaveBeenCalled())
  })

  it('marcar uma tarefa como concluída no checklist chama dataSource.setTaskStatus com feito', async () => {
    vi.mocked(dataSource.listTasks).mockResolvedValue([buildTask()])
    vi.mocked(dataSource.setTaskStatus).mockResolvedValue(buildTask({ status: 'feito' }))
    mockTimer()

    renderTimerPage()
    await screen.findByText('Relatório mensal')

    await userEvent.click(screen.getByRole('checkbox', { name: 'Relatório mensal' }))

    expect(dataSource.setTaskStatus).toHaveBeenCalledWith(1, 'feito')
  })

  describe('alternância de modo (Parte 5)', () => {
    it('inicia no modo clássico', () => {
      mockTimer()
      mockFlexibleTimer()
      renderTimerPage()

      expect(screen.getByRole('tab', { name: 'Pomodoro Clássico', selected: true })).toBeInTheDocument()
      expect(screen.getByText('25:00')).toBeInTheDocument()
    })

    it('alternar para "Customizado" troca para a FlexibleTimerView e some com a tela clássica', async () => {
      mockTimer()
      mockFlexibleTimer()
      renderTimerPage()

      await userEvent.click(screen.getByRole('tab', { name: 'Customizado' }))

      expect(screen.getByText('Quanto tempo você quer plantar?')).toBeInTheDocument()
      expect(screen.queryByText('25:00')).not.toBeInTheDocument()
      expect(trackEvent).toHaveBeenCalledWith('mode_switch', { mode: 'flexivel' })
    })

    it('voltar para "Pomodoro Clássico" restaura a tela clássica', async () => {
      mockTimer()
      mockFlexibleTimer()
      renderTimerPage()

      await userEvent.click(screen.getByRole('tab', { name: 'Customizado' }))
      await userEvent.click(screen.getByRole('tab', { name: 'Pomodoro Clássico' }))

      expect(screen.getByText('25:00')).toBeInTheDocument()
      expect(screen.queryByText('Quanto tempo você quer plantar nesse foco?')).not.toBeInTheDocument()
    })
  })

  describe('trava do seletor de modo durante sessão ativa', () => {
    it('com o timer clássico rodando, o card "Customizado" fica travado (aria-disabled, com tooltip) e não troca de tela', async () => {
      mockTimer({ phase: 'rodando', canFinalize: true })
      mockFlexibleTimer()
      renderTimerPage()

      const flexivelTab = screen.getByRole('tab', { name: 'Customizado' })
      expect(flexivelTab).toHaveAttribute('aria-disabled', 'true')
      expect(flexivelTab).not.toBeDisabled()

      await userEvent.click(flexivelTab)

      expect(screen.getByText('25:00')).toBeInTheDocument()
    })

    it('com o timer clássico pausado, o card "Customizado" continua travado — pausar não libera a troca', async () => {
      const finalize = vi.fn()
      mockTimer({ phase: 'pausado', canFinalize: true, finalize })
      mockFlexibleTimer()
      renderTimerPage()

      const flexivelTab = screen.getByRole('tab', { name: 'Customizado' })
      expect(flexivelTab).toHaveAttribute('aria-disabled', 'true')

      await userEvent.click(flexivelTab)

      expect(finalize).not.toHaveBeenCalled()
      expect(screen.getByText('25:00')).toBeInTheDocument()
    })

    it('com um foco flexível rodando, o card "Pomodoro Clássico" fica travado', async () => {
      mockTimer()
      mockFlexibleTimer({ phase: { kind: 'foco_rodando' } })
      renderTimerPage()

      await userEvent.click(screen.getByRole('tab', { name: 'Customizado' }))

      const classicoTab = screen.getByRole('tab', { name: 'Pomodoro Clássico' })
      expect(classicoTab).toHaveAttribute('aria-disabled', 'true')

      await userEvent.click(classicoTab)

      // Continua na visão flexível (clique no card travado não fez nada) — "Foco flexível" é o
      // selo de `FlexibleFocusView`, não existe na tela clássica.
      expect(screen.getByText('Foco flexível')).toBeInTheDocument()
      expect(screen.queryByText('25:00')).not.toBeInTheDocument()
    })

    it('com um foco flexível pausado, o card "Pomodoro Clássico" continua travado — pausar não libera a troca', async () => {
      const endCurrentBlockNow = vi.fn()
      mockTimer()
      mockFlexibleTimer({ phase: { kind: 'foco_pausado' }, endCurrentBlockNow })
      renderTimerPage()

      await userEvent.click(screen.getByRole('tab', { name: 'Customizado' }))
      const classicoTab = screen.getByRole('tab', { name: 'Pomodoro Clássico' })
      expect(classicoTab).toHaveAttribute('aria-disabled', 'true')

      await userEvent.click(classicoTab)

      expect(endCurrentBlockNow).not.toHaveBeenCalled()
      // Ainda na visão flexível (não voltou pro clássico) — "Continuar" é o botão de retomar o foco
      // pausado, só existe em `FlexibleFocusView`.
      expect(screen.getByRole('button', { name: 'Continuar' })).toBeInTheDocument()
      expect(screen.queryByText('25:00')).not.toBeInTheDocument()
    })

    it('sem sessão ativa em nenhum modo, nenhum card fica travado', () => {
      mockTimer()
      mockFlexibleTimer()
      renderTimerPage()

      expect(screen.getByRole('tab', { name: 'Pomodoro Clássico' })).not.toHaveAttribute('aria-disabled')
      expect(screen.getByRole('tab', { name: 'Customizado' })).not.toHaveAttribute('aria-disabled')
    })
  })
})
