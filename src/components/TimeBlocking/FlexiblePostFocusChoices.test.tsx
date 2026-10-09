import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import * as FlexibleTimerContextModule from '../../context/FlexibleTimerContext'
import { FlexiblePostFocusChoices } from './FlexiblePostFocusChoices'

function mockFlexibleTimer(overrides: Partial<ReturnType<typeof FlexibleTimerContextModule.useFlexibleTimerContext>> = {}) {
  vi.spyOn(FlexibleTimerContextModule, 'useFlexibleTimerContext').mockReturnValue({
    startBreak: vi.fn(),
    startAnotherFocus: vi.fn(),
    addTime: vi.fn(),
    endSession: vi.fn(),
    focusBlocksCompleted: 1,
    ...overrides,
  } as ReturnType<typeof FlexibleTimerContextModule.useFlexibleTimerContext>)
}

describe('FlexiblePostFocusChoices', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('renderiza as 4 opções e nomeia a espécie recém-concluída', () => {
    mockFlexibleTimer({ focusBlocksCompleted: 1 })
    render(<FlexiblePostFocusChoices />)

    expect(screen.getByText('Foco concluído!')).toBeInTheDocument()
    expect(screen.getByText('Seu Tomatinho nasceu. O que vem agora?')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Fazer uma pausa' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Começar outro foco' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '+5 min' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '+10 min' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Encerrar sessão' })).toBeInTheDocument()
  })

  it('a segunda espécie concluída no dia aparece na mensagem', () => {
    mockFlexibleTimer({ focusBlocksCompleted: 2 })
    render(<FlexiblePostFocusChoices />)

    expect(screen.getByText('Seu Moranguinho nasceu. O que vem agora?')).toBeInTheDocument()
  })

  it('"Fazer uma pausa" chama startBreak', async () => {
    const startBreak = vi.fn()
    mockFlexibleTimer({ startBreak })
    render(<FlexiblePostFocusChoices />)

    await userEvent.click(screen.getByRole('button', { name: 'Fazer uma pausa' }))

    expect(startBreak).toHaveBeenCalledTimes(1)
  })

  it('"+5 min" chama addTime com 300 segundos', async () => {
    const addTime = vi.fn()
    mockFlexibleTimer({ addTime })
    render(<FlexiblePostFocusChoices />)

    await userEvent.click(screen.getByRole('button', { name: '+5 min' }))

    expect(addTime).toHaveBeenCalledWith(5 * 60)
  })

  it('"Encerrar sessão" chama endSession', async () => {
    const endSession = vi.fn()
    mockFlexibleTimer({ endSession })
    render(<FlexiblePostFocusChoices />)

    await userEvent.click(screen.getByRole('button', { name: 'Encerrar sessão' }))

    expect(endSession).toHaveBeenCalledTimes(1)
  })
})
