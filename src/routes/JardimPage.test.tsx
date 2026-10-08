import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { DataSource } from '../lib/dataSource'
import { buildMockDataSource, DATA_SOURCE_MODES, mockUseDataSource } from '../test/dataSourceMocks'
import type { PomodoroSession } from '../types/api'
import { JardimPage } from './JardimPage'

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

describe.each(DATA_SOURCE_MODES)('JardimPage (mode: %s)', (mode) => {
  let dataSource: DataSource

  beforeEach(() => {
    dataSource = buildMockDataSource()
    vi.mocked(dataSource.listSessions).mockResolvedValue({ items: [], totalCount: 0, limit: 10, offset: 0 })
    mockUseDataSource(dataSource, mode)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('exibe o histórico vindo do dataSource', async () => {
    vi.mocked(dataSource.listSessions).mockResolvedValue({
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
    vi.mocked(dataSource.listSessions).mockResolvedValue({
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
    vi.mocked(dataSource.listSessions).mockResolvedValueOnce({
      items: [buildSession({ id: 1 })],
      totalCount: 2,
      limit: 1,
      offset: 0,
    })
    render(<JardimPage />)
    await screen.findByText('Concluído')

    vi.mocked(dataSource.listSessions).mockResolvedValueOnce({
      items: [buildSession({ id: 2, completedAt: '2026-01-01T09:00:00Z' })],
      totalCount: 2,
      limit: 1,
      offset: 1,
    })
    await userEvent.click(screen.getByRole('button', { name: 'Ver mais' }))

    expect(await screen.findAllByText('Concluído')).toHaveLength(2)
  })
})
