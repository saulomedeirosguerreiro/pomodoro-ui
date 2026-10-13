import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import * as TimerContextModule from '../../context/TimerContext'
import type { AppEvent } from '../../context/TimerContext'
import { EventsBell } from './EventsBell'

function mockEvents(events: AppEvent[], markEventsSeen = vi.fn()) {
  vi.spyOn(TimerContextModule, 'useTimerContext').mockReturnValue({
    events,
    markEventsSeen,
  } as unknown as ReturnType<typeof TimerContextModule.useTimerContext>)
  return markEventsSeen
}

describe('EventsBell', () => {
  it('começa fechado, mostrando a contagem de eventos não vistos', () => {
    mockEvents([
      { id: '1', type: 'achievement', message: 'Conquista desbloqueada: Primeira Semente', seen: false },
    ])

    render(<EventsBell />)

    expect(screen.getByRole('button', { name: 'Notificações' })).toHaveTextContent('1')
    expect(screen.queryByRole('menu')).not.toBeInTheDocument()
  })

  it('abre ao clicar no sino, marca os eventos como vistos e mostra os ícones por tipo', async () => {
    const user = userEvent.setup()
    const markEventsSeen = mockEvents([
      { id: '1', type: 'achievement', message: 'Conquista desbloqueada: Primeira Semente', seen: false },
      { id: '2', type: 'level', message: 'Nível 2 alcançado!', seen: false },
    ])

    render(<EventsBell />)

    await user.click(screen.getByRole('button', { name: 'Notificações' }))

    expect(screen.getByRole('menu')).toBeInTheDocument()
    expect(screen.getByText('Conquista desbloqueada: Primeira Semente')).toBeInTheDocument()
    expect(screen.getByText('Nível 2 alcançado!')).toBeInTheDocument()
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

  it('fecha ao clicar fora', async () => {
    const user = userEvent.setup()
    mockEvents([])

    render(<EventsBell />)
    await user.click(screen.getByRole('button', { name: 'Notificações' }))
    expect(screen.getByRole('menu')).toBeInTheDocument()

    await user.click(document.body)

    expect(screen.queryByRole('menu')).not.toBeInTheDocument()
  })

  it('fecha com Escape', async () => {
    const user = userEvent.setup()
    mockEvents([])

    render(<EventsBell />)
    await user.click(screen.getByRole('button', { name: 'Notificações' }))
    expect(screen.getByRole('menu')).toBeInTheDocument()

    await user.keyboard('{Escape}')

    expect(screen.queryByRole('menu')).not.toBeInTheDocument()
  })
})
