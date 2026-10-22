import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { DataSource } from '../lib/dataSource'
import { buildMockDataSource, DATA_SOURCE_MODES, mockUseDataSource } from '../test/dataSourceMocks'
import type { Achievement, PagedResult } from '../types/api'
import { ConquistasPage } from './ConquistasPage'

function buildAchievement(overrides: Partial<Achievement> = {}): Achievement {
  return {
    code: 'primeira_semente',
    name: 'Primeira Semente',
    description: 'Conclua seu primeiro foco.',
    unlockedAt: null,
    progressCurrent: null,
    progressTarget: null,
    ...overrides,
  }
}

function buildPage(items: Achievement[], totalCount = items.length, offset = 0): PagedResult<Achievement> {
  return { items, totalCount, limit: 10, offset }
}

describe.each(DATA_SOURCE_MODES)('ConquistasPage (mode: %s)', (mode) => {
  let dataSource: DataSource

  beforeEach(() => {
    dataSource = buildMockDataSource()
    vi.mocked(dataSource.listAchievements).mockResolvedValue(buildPage([]))
    mockUseDataSource(dataSource, mode)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('mostra mensagens de estado vazio quando não há conquistas desbloqueadas ou bloqueadas', async () => {
    render(<ConquistasPage />)

    expect(await screen.findByText(/continue focando/i)).toBeInTheDocument()
    expect(screen.getByText(/desbloqueou todas as conquistas/i)).toBeInTheDocument()
  })

  it('exibe conquistas desbloqueadas com a data e sem tom de cobrança nas bloqueadas', async () => {
    vi.mocked(dataSource.listAchievements).mockResolvedValue(
      buildPage([
        buildAchievement({ code: 'primeira_semente', unlockedAt: '2026-01-01T10:00:00Z' }),
        buildAchievement({
          code: 'cem_tomates',
          name: 'Cem Tomates',
          description: 'Conclua 100 focos.',
          progressCurrent: 37,
          progressTarget: 100,
        }),
      ]),
    )

    render(<ConquistasPage />)

    expect(await screen.findByText('Primeira Semente')).toBeInTheDocument()
    expect(screen.getByText(/desbloqueada em/i)).toBeInTheDocument()
    expect(screen.getByText('Cem Tomates')).toBeInTheDocument()
    expect(screen.getByText('37/100')).toBeInTheDocument()
  })

  it('mostra erro quando a busca falha', async () => {
    vi.mocked(dataSource.listAchievements).mockRejectedValue(new Error('network'))

    render(<ConquistasPage />)

    expect(await screen.findByText('Não foi possível carregar as conquistas.')).toBeInTheDocument()
  })

  it('"Ver mais" carrega a próxima página sem duplicar', async () => {
    // Códigos reais (existentes no catálogo i18n) — o texto exibido vem de `catalog.<code>.name`,
    // não do campo `name` do objeto, então o mock precisa usar códigos que o catálogo conhece.
    const firstPageCodes = [
      'primeira_semente', 'constancia_1', 'nivel_2', 'primeira_colheita', 'descanso_1',
      'pausa_longa_1', 'constancia_3', 'dia_produtivo_4', 'ciclo_completo', 'constancia_5',
    ]
    const secondPageCodes = ['nivel_5', 'colheita_5', 'descanso_5', 'pausa_longa_5', 'constancia_7']
    const firstPage = firstPageCodes.map((code) => buildAchievement({ code }))
    const secondPage = secondPageCodes.map((code) => buildAchievement({ code }))
    vi.mocked(dataSource.listAchievements)
      .mockResolvedValueOnce(buildPage(firstPage, 15, 0))
      .mockResolvedValueOnce(buildPage(secondPage, 15, 10))

    render(<ConquistasPage />)

    expect(await screen.findByText('Primeira Semente')).toBeInTheDocument()
    expect(screen.queryByText('Nível 5')).not.toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: /ver mais/i }))

    expect(await screen.findByText('Nível 5')).toBeInTheDocument()
    expect(screen.getByText('Primeira Semente')).toBeInTheDocument()
    expect(dataSource.listAchievements).toHaveBeenCalledWith(10, 0)
    expect(dataSource.listAchievements).toHaveBeenCalledWith(10, 10)
  })
})
