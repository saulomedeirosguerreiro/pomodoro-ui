import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import * as TimerContextModule from '../../context/TimerContext'
import type { AppEvent } from '../../context/TimerContext'
import { formatEventTimestamp } from '../../lib/format'
import { EventsBell } from './EventsBell'

function mockEvents(events: AppEvent[], markEventsSeen = vi.fn()) {
  vi.spyOn(TimerContextModule, 'useTimerContext').mockReturnValue({
    events,
    markEventsSeen,
  } as unknown as ReturnType<typeof TimerContextModule.useTimerContext>)
  return markEventsSeen
}

function hoursAgo(hours: number) {
  return new Date(Date.now() - hours * 60 * 60 * 1000).toISOString()
}

describe('EventsBell', () => {
  it('começa fechado, mostrando a contagem de eventos não vistos', () => {
    mockEvents([
      {
        id: '1',
        type: 'achievement',
        message: 'Conquista desbloqueada: Primeira Semente',
        seen: false,
        createdAt: hoursAgo(1),
      },
    ])

    render(<EventsBell />)

    expect(screen.getByRole('button', { name: 'Notificações' })).toHaveTextContent('1')
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('abre ao clicar no sino, marca os eventos como vistos e mostra ícone + data/hora por evento', async () => {
    const user = userEvent.setup()
    const achievementCreatedAt = hoursAgo(1)
    const levelCreatedAt = hoursAgo(30)
    const markEventsSeen = mockEvents([
      {
        id: '1',
        type: 'achievement',
        message: 'Conquista desbloqueada: Primeira Semente',
        seen: false,
        createdAt: achievementCreatedAt,
      },
      { id: '2', type: 'level', message: 'Nível 2 alcançado!', seen: false, createdAt: levelCreatedAt },
    ])

    render(<EventsBell />)

    await user.click(screen.getByRole('button', { name: 'Notificações' }))

    expect(screen.getByRole('dialog', { name: 'Notificações' })).toBeInTheDocument()
    expect(screen.getByText('Conquista desbloqueada: Primeira Semente')).toBeInTheDocument()
    expect(screen.getByText(formatEventTimestamp(achievementCreatedAt))).toBeInTheDocument()
    expect(screen.getByText('Nível 2 alcançado!')).toBeInTheDocument()
    expect(screen.getByText(formatEventTimestamp(levelCreatedAt))).toBeInTheDocument()
    expect(screen.getByText('🏆')).toBeInTheDocument()
    expect(screen.getByText('⭐')).toBeInTheDocument()
    expect(markEventsSeen).toHaveBeenCalledTimes(1)
  })

  it('mostra o estado vazio quando não há eventos', async () => {
    const user = userEvent.setup()
    mockEvents([])

    render(<EventsBell />)
    await user.click(screen.getByRole('button', { name: 'Notificações' }))

    expect(screen.getByText('Nenhum evento por aqui ainda.')).toBeInTheDocument()
  })

  it('fecha ao clicar no botão de fechar', async () => {
    const user = userEvent.setup()
    mockEvents([])

    render(<EventsBell />)
    await user.click(screen.getByRole('button', { name: 'Notificações' }))
    expect(screen.getByRole('dialog')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Fechar notificações' }))

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('fecha ao clicar no backdrop (fora do painel)', async () => {
    const user = userEvent.setup()
    mockEvents([])

    render(<EventsBell />)
    await user.click(screen.getByRole('button', { name: 'Notificações' }))
    expect(screen.getByRole('dialog')).toBeInTheDocument()

    await user.click(screen.getByTestId('notifications-backdrop'))

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('fecha com Escape', async () => {
    const user = userEvent.setup()
    mockEvents([])

    render(<EventsBell />)
    await user.click(screen.getByRole('button', { name: 'Notificações' }))
    expect(screen.getByRole('dialog')).toBeInTheDocument()

    await user.keyboard('{Escape}')

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })
})
