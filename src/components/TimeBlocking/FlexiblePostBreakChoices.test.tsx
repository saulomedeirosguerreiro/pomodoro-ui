import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import * as FlexibleTimerContextModule from '../../context/FlexibleTimerContext'
import { FlexiblePostBreakChoices } from './FlexiblePostBreakChoices'

function mockFlexibleTimer(overrides: Partial<ReturnType<typeof FlexibleTimerContextModule.useFlexibleTimerContext>> = {}) {
  vi.spyOn(FlexibleTimerContextModule, 'useFlexibleTimerContext').mockReturnValue({
    backToFocus: vi.fn(),
    endSession: vi.fn(),
    ...overrides,
  } as ReturnType<typeof FlexibleTimerContextModule.useFlexibleTimerContext>)
}

describe('FlexiblePostBreakChoices', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('renderiza as 2 opções', () => {
    mockFlexibleTimer()
    render(<FlexiblePostBreakChoices />)

    expect(screen.getByRole('button', { name: 'Voltar ao foco' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Encerrar sessão' })).toBeInTheDocument()
  })

  it('"Voltar ao foco" chama backToFocus', async () => {
    const backToFocus = vi.fn()
    mockFlexibleTimer({ backToFocus })
    render(<FlexiblePostBreakChoices />)

    await userEvent.click(screen.getByRole('button', { name: 'Voltar ao foco' }))

    expect(backToFocus).toHaveBeenCalledTimes(1)
  })

  it('"Encerrar sessão" chama endSession', async () => {
    const endSession = vi.fn()
    mockFlexibleTimer({ endSession })
    render(<FlexiblePostBreakChoices />)

    await userEvent.click(screen.getByRole('button', { name: 'Encerrar sessão' }))

    expect(endSession).toHaveBeenCalledTimes(1)
  })
})
