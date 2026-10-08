import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import type { PomodoroSession } from '../../types/api'
import { HistoryList } from './HistoryList'

const SESSION: PomodoroSession = {
  id: 1,
  type: 'foco',
  status: 'concluido',
  durationSeconds: 1500,
  startedAt: '2026-01-01T10:00:00Z',
  completedAt: '2026-01-01T10:25:00Z',
  createdAt: '2026-01-01T10:25:00Z',
}

describe('HistoryList', () => {
  it('mostra estado de carregando quando items é null', () => {
    render(<HistoryList items={null} error={null} onRetry={vi.fn()} />)

    expect(screen.getByText(/carregando histórico/i)).toBeInTheDocument()
  })

  it('mostra estado vazio quando não há sessões', () => {
    render(<HistoryList items={[]} error={null} onRetry={vi.fn()} />)

    expect(screen.getByText(/nenhuma sessão registrada/i)).toBeInTheDocument()
  })

  it('mostra erro com botão de tentar novamente', async () => {
    const onRetry = vi.fn()
    render(<HistoryList items={null} error="Não foi possível carregar o histórico." onRetry={onRetry} />)

    await userEvent.click(screen.getByRole('button', { name: /tentar novamente/i }))

    expect(onRetry).toHaveBeenCalledTimes(1)
  })

  it('renderiza as sessões com tipo, status e duração', () => {
    render(<HistoryList items={[SESSION]} error={null} onRetry={vi.fn()} />)

    expect(screen.getByText('Foco')).toBeInTheDocument()
    expect(screen.getByText('Concluído')).toBeInTheDocument()
    expect(screen.getByText('25 min')).toBeInTheDocument()
  })
})
