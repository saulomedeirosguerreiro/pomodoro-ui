import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import * as FlexibleTimerContextModule from '../../context/FlexibleTimerContext'
import { FlexiblePostBreakChoices } from './FlexiblePostBreakChoices'

function mockFlexibleTimer(overrides: Partial<ReturnType<typeof FlexibleTimerContextModule.useFlexibleTimerContext>> = {}) {
  vi.spyOn(FlexibleTimerContextModule, 'useFlexibleTimerContext').mockReturnValue({
    backToFocus: vi.fn(),
    startBreak: vi.fn(),
    ...overrides,
  } as ReturnType<typeof FlexibleTimerContextModule.useFlexibleTimerContext>)
}

describe('FlexiblePostBreakChoices', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('renderiza os dois botões (Foco/Pausa)', () => {
    mockFlexibleTimer()
    render(<FlexiblePostBreakChoices />)

    expect(screen.getByRole('button', { name: '🌱 Foco' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '☕ Pausa' })).toBeInTheDocument()
  })

  it('clicar em "Foco" chama backToFocus', async () => {
    const backToFocus = vi.fn()
    mockFlexibleTimer({ backToFocus })
    render(<FlexiblePostBreakChoices />)

    await userEvent.click(screen.getByRole('button', { name: '🌱 Foco' }))

    expect(backToFocus).toHaveBeenCalledTimes(1)
  })

  it('clicar em "Pausa" chama startBreak', async () => {
    const startBreak = vi.fn()
    mockFlexibleTimer({ startBreak })
    render(<FlexiblePostBreakChoices />)

    await userEvent.click(screen.getByRole('button', { name: '☕ Pausa' }))

    expect(startBreak).toHaveBeenCalledTimes(1)
  })
})
