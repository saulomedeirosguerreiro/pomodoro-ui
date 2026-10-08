import { render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { achievementsService } from '../lib/achievementsService'
import type { Achievement } from '../types/api'
import { ConquistasPage } from './ConquistasPage'

vi.mock('../lib/achievementsService', () => ({
  achievementsService: { list: vi.fn() },
}))

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

describe('ConquistasPage', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  beforeEach(() => {
    vi.mocked(achievementsService.list).mockResolvedValue([])
  })

  it('mostra mensagens de estado vazio quando não há conquistas desbloqueadas ou bloqueadas', async () => {
    render(<ConquistasPage />)

    expect(await screen.findByText(/continue focando/i)).toBeInTheDocument()
    expect(screen.getByText(/desbloqueou todas as conquistas/i)).toBeInTheDocument()
  })

  it('exibe conquistas desbloqueadas com a data e sem tom de cobrança nas bloqueadas', async () => {
    vi.mocked(achievementsService.list).mockResolvedValue([
      buildAchievement({ code: 'primeira_semente', unlockedAt: '2026-01-01T10:00:00Z' }),
      buildAchievement({
        code: 'cem_tomates',
        name: 'Cem Tomates',
        description: 'Conclua 100 focos.',
        progressCurrent: 37,
        progressTarget: 100,
      }),
    ])

    render(<ConquistasPage />)

    expect(await screen.findByText('Primeira Semente')).toBeInTheDocument()
    expect(screen.getByText(/desbloqueada em/i)).toBeInTheDocument()
    expect(screen.getByText('Cem Tomates')).toBeInTheDocument()
    expect(screen.getByText('37/100')).toBeInTheDocument()
  })

  it('mostra erro quando a busca falha', async () => {
    vi.mocked(achievementsService.list).mockRejectedValue(new Error('network'))

    render(<ConquistasPage />)

    expect(await screen.findByText('Não foi possível carregar as conquistas.')).toBeInTheDocument()
  })
})
