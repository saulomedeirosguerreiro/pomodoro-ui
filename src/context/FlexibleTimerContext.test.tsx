import { act, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { buildMockDataSource, mockUseDataSource } from '../test/dataSourceMocks'
import type { DataSource } from '../lib/dataSource'
import { trackEvent } from '../lib/analytics'
import { ApiError } from '../types/api'
import type { Achievement, PomodoroSession, ProgressSummary } from '../types/api'
import { FlexibleTimerProvider, useFlexibleTimerContext } from './FlexibleTimerContext'
import { SessionRegistrationProvider } from './SessionRegistrationContext'
import { SettingsProvider } from './SettingsContext'

vi.mock('../lib/analytics', () => ({
  trackEvent: vi.fn(),
}))

/** Consumidor mínimo só para expor o estado relevante do contexto nas asserções via DOM. */
function Probe() {
  const flexible = useFlexibleTimerContext()
  return (
    <div>
      <p>fase: {flexible.phase.kind}</p>
      <p>erro: {flexible.registrationError ?? 'nenhum'}</p>
      <p>pode tentar novamente: {flexible.canRetryRegistration ? 'sim' : 'não'}</p>
      <p>reward: {flexible.rewardToast ? `${flexible.rewardToast.xp}xp/${flexible.rewardToast.seeds}sementes` : 'nenhum'}</p>
      <p>conquista: {flexible.achievementToast ? flexible.achievementToast.name : 'nenhuma'}</p>
      <button onClick={flexible.startFocus}>iniciar foco</button>
      <button onClick={flexible.endCurrentBlockNow}>encerrar agora</button>
      <button onClick={flexible.retryRegistration}>tentar novamente</button>
      <button onClick={flexible.dismissRewardToast}>dispensar reward</button>
      <button onClick={flexible.dismissAchievementToast}>dispensar conquista</button>
    </div>
  )
}

function renderProbe() {
  return render(
    <SettingsProvider>
      <SessionRegistrationProvider>
        <FlexibleTimerProvider>
          <Probe />
        </FlexibleTimerProvider>
      </SessionRegistrationProvider>
    </SettingsProvider>,
  )
}

function progress(overrides: Partial<ProgressSummary> = {}): ProgressSummary {
  return {
    level: 1,
    title: 'Semente Curiosa',
    xpInLevel: 0,
    xpForNextLevel: 200,
    totalXp: 0,
    seeds: 0,
    streakDays: 0,
    isStreakAtRiskToday: false,
    todayFocusCount: 0,
    todayFocusSeconds: 0,
    ...overrides,
  }
}

function session(overrides: Partial<PomodoroSession> = {}): PomodoroSession {
  return {
    id: 1,
    type: 'foco',
    status: 'concluido',
    durationSeconds: 300,
    startedAt: '2026-01-01T10:00:00Z',
    completedAt: '2026-01-01T10:05:00Z',
    createdAt: '2026-01-01T10:05:00Z',
    mode: 'flexivel',
    plannedDurationSeconds: 300,
    addedSeconds: 0,
    ...overrides,
  }
}

/** Inicia o foco padrão (5min) e avança o relógio falso até a conclusão natural, flutuando a cadeia de promises do registro (`advanceTimersByTimeAsync`). */
async function completeDefaultFocusBlock() {
  fireEvent.click(screen.getByRole('button', { name: 'iniciar foco' }))
  expect(screen.getByText('fase: foco_rodando')).toBeInTheDocument()

  await act(async () => {
    await vi.advanceTimersByTimeAsync(5 * 60 * 1000 + 500)
  })
}

describe('FlexibleTimerContext', () => {
  let dataSource: DataSource

  beforeEach(() => {
    vi.useFakeTimers()
    dataSource = buildMockDataSource()
    vi.mocked(dataSource.listTasks).mockResolvedValue([])
    vi.mocked(dataSource.listAchievements).mockResolvedValue([])
    vi.mocked(dataSource.getProgress).mockResolvedValue(progress())
    vi.mocked(dataSource.getTotalCompletedFocusCount).mockResolvedValue(0)
    mockUseDataSource(dataSource, 'guest')
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.restoreAllMocks()
  })

  it('sucesso: registra a sessão concluída e mostra o reward toast com XP/sementes ganhos', async () => {
    vi.mocked(dataSource.createSession).mockResolvedValue(session())
    vi.mocked(dataSource.getProgress)
      .mockResolvedValueOnce(progress()) // baseline, no mount
      .mockResolvedValueOnce(progress({ totalXp: 25, seeds: 15 })) // após o registro

    renderProbe()
    await completeDefaultFocusBlock()

    expect(dataSource.createSession).toHaveBeenCalledTimes(1)
    expect(dataSource.createSession).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'foco', status: 'concluido', mode: 'flexivel', plannedDurationSeconds: 300, addedSeconds: 0 }),
    )

    expect(screen.getByText('reward: 25xp/15sementes')).toBeInTheDocument()
    expect(screen.getByText('fase: foco_concluido')).toBeInTheDocument()
    expect(screen.getByText('erro: nenhum')).toBeInTheDocument()
    expect(trackEvent).toHaveBeenCalledWith('focus_completed', { duration_seconds: 300 })

    fireEvent.click(screen.getByRole('button', { name: 'dispensar reward' }))
    expect(screen.getByText('reward: nenhum')).toBeInTheDocument()
  })

  it('erro + retry: falha ao registrar mostra o erro; tentar novamente registra com sucesso e limpa o erro', async () => {
    vi.mocked(dataSource.createSession).mockRejectedValueOnce(new Error('offline')).mockResolvedValueOnce(session())

    renderProbe()
    await completeDefaultFocusBlock()

    expect(screen.getByText('erro: Não foi possível registrar a sessão. Seus dados não foram perdidos.')).toBeInTheDocument()

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'tentar novamente' }))
      await vi.advanceTimersByTimeAsync(0)
    })

    expect(dataSource.createSession).toHaveBeenCalledTimes(2)
    expect(screen.getByText('erro: nenhum')).toBeInTheDocument()
  })

  it('duração fora da faixa: mostra mensagem específica e não permite retry (reenviar a mesma duração falharia de novo)', async () => {
    vi.mocked(dataSource.createSession).mockRejectedValue(
      new ApiError(422, {
        code: 'validation_error',
        message: 'Dados inválidos.',
        fields: [{ field: 'DurationSeconds', message: 'Duração fora da faixa permitida para o tipo informado.' }],
      }),
    )

    renderProbe()
    fireEvent.click(screen.getByRole('button', { name: 'iniciar foco' }))
    expect(screen.getByText('fase: foco_rodando')).toBeInTheDocument()

    await act(async () => {
      vi.advanceTimersByTime(1000)
      fireEvent.click(screen.getByRole('button', { name: 'encerrar agora' }))
      await vi.advanceTimersByTimeAsync(0)
    })

    expect(screen.getByText('erro: Esse bloco de foco durou menos que o mínimo de 5 min e por isso não entra no seu histórico. Não é um erro — pode seguir normalmente.')).toBeInTheDocument()
    expect(screen.getByText('pode tentar novamente: não')).toBeInTheDocument()

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'tentar novamente' }))
      await vi.advanceTimersByTimeAsync(0)
    })

    expect(dataSource.createSession).toHaveBeenCalledTimes(1)
  })

  it('conquista: uma conquista recém-desbloqueada após o registro aparece como toast', async () => {
    const achievement: Achievement = {
      code: 'primeira_semente',
      name: 'Primeira Semente',
      description: 'Complete seu primeiro foco.',
      unlockedAt: '2026-01-01T10:05:00Z',
      progressCurrent: 1,
      progressTarget: 1,
    }
    vi.mocked(dataSource.createSession).mockResolvedValue(session())
    vi.mocked(dataSource.listAchievements)
      .mockResolvedValueOnce([{ ...achievement, unlockedAt: null }]) // baseline, no mount
      .mockResolvedValueOnce([achievement]) // após o registro

    renderProbe()
    await completeDefaultFocusBlock()

    expect(screen.getByText('conquista: Primeira Semente')).toBeInTheDocument()
    expect(trackEvent).toHaveBeenCalledWith('achievement_unlocked', { achievement_code: 'primeira_semente' })

    fireEvent.click(screen.getByRole('button', { name: 'dispensar conquista' }))
    expect(screen.getByText('conquista: nenhuma')).toBeInTheDocument()
  })

  it('nível: subir de nível envia o evento level_up com o novo nível', async () => {
    vi.mocked(dataSource.createSession).mockResolvedValue(session())
    vi.mocked(dataSource.getProgress)
      .mockResolvedValueOnce(progress({ level: 1 })) // baseline, no mount
      .mockResolvedValueOnce(progress({ level: 2, totalXp: 25, seeds: 15 })) // após o registro

    renderProbe()
    await completeDefaultFocusBlock()

    expect(trackEvent).toHaveBeenCalledWith('level_up', { level: 2 })
  })
})
