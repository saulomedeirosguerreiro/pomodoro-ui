import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { pomodorosService } from '../lib/pomodorosService'
import type { PomodoroSession } from '../types/api'
import { JardimPage } from './JardimPage'

vi.mock('../lib/pomodorosService', () => ({
  pomodorosService: { list: vi.fn() },
}))

function buildSession(overrides: Partial<PomodoroSession>): PomodoroSession {
  return {
    id: 1,
    type: 'foco',
    status: 'concluido',
    durationSeconds: 1500,
    startedAt: '2026-01-01T10:00:00Z',
    completedAt: '2026-01-01T10:25:00Z',
    createdAt: '2026-01-01T10:25:00Z',
    ...overrides,
  }
}

describe('JardimPage', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  beforeEach(() => {
    vi.mocked(pomodorosService.list).mockResolvedValue({ items: [], totalCount: 0, limit: 10, offset: 0 })
  })

  it('exibe o histórico vindo da API', async () => {
    vi.mocked(pomodorosService.list).mockResolvedValue({
      items: [buildSession({ id: 1 })],
      totalCount: 1,
      limit: 10,
      offset: 0,
    })

    render(<JardimPage />)

    expect(await screen.findByText('Concluído')).toBeInTheDocument()
  })

  it('mostra estado vazio quando não há sessões', async () => {
    render(<JardimPage />)

    expect(await screen.findByText(/nenhuma sessão registrada/i)).toBeInTheDocument()
    expect(screen.getByText(/nenhuma planta colhida/i)).toBeInTheDocument()
  })

  it('monta a coleção a partir dos focos concluídos', async () => {
    vi.mocked(pomodorosService.list).mockResolvedValue({
      items: [
        buildSession({ id: 2, completedAt: '2026-01-01T11:00:00Z' }),
        buildSession({ id: 1, completedAt: '2026-01-01T10:00:00Z' }),
      ],
      totalCount: 2,
      limit: 10,
      offset: 0,
    })

    render(<JardimPage />)

    expect(await screen.findByText('Tomatinho')).toBeInTheDocument()
    expect(screen.getByText('Moranguinho')).toBeInTheDocument()
  })

  it('"Ver mais" carrega a próxima página sem duplicar', async () => {
    vi.mocked(pomodorosService.list).mockResolvedValueOnce({
      items: [buildSession({ id: 1 })],
      totalCount: 2,
      limit: 1,
      offset: 0,
    })
    render(<JardimPage />)
    await screen.findByText('Concluído')

    vi.mocked(pomodorosService.list).mockResolvedValueOnce({
      items: [buildSession({ id: 2, completedAt: '2026-01-01T09:00:00Z' })],
      totalCount: 2,
      limit: 1,
      offset: 1,
    })
    await userEvent.click(screen.getByRole('button', { name: 'Ver mais' }))

    expect(await screen.findAllByText('Concluído')).toHaveLength(2)
  })
})
