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
    focusBlocksCompleted: 1,
    ...overrides,
  } as ReturnType<typeof FlexibleTimerContextModule.useFlexibleTimerContext>)
}

describe('FlexiblePostFocusChoices', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('renderiza os dois botões (Foco/Pausa), as opções de estender e nomeia a espécie recém-concluída', () => {
    mockFlexibleTimer({ focusBlocksCompleted: 1 })
    render(<FlexiblePostFocusChoices />)

    expect(screen.getByText('Foco concluído!')).toBeInTheDocument()
    expect(screen.getByText('Seu Tomatinho nasceu. O que vem agora?')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '🌱 Foco' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '☕ Pausa' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '+5 min' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '+10 min' })).toBeInTheDocument()
  })

  it('a segunda espécie concluída no dia aparece na mensagem', () => {
    mockFlexibleTimer({ focusBlocksCompleted: 2 })
    render(<FlexiblePostFocusChoices />)

    expect(screen.getByText('Seu Moranguinho nasceu. O que vem agora?')).toBeInTheDocument()
  })

  it('clicar em "Pausa" chama startBreak', async () => {
    const startBreak = vi.fn()
    mockFlexibleTimer({ startBreak })
    render(<FlexiblePostFocusChoices />)

    await userEvent.click(screen.getByRole('button', { name: '☕ Pausa' }))

    expect(startBreak).toHaveBeenCalledTimes(1)
  })

  it('clicar em "Foco" chama startAnotherFocus', async () => {
    const startAnotherFocus = vi.fn()
    mockFlexibleTimer({ startAnotherFocus })
    render(<FlexiblePostFocusChoices />)

    await userEvent.click(screen.getByRole('button', { name: '🌱 Foco' }))

    expect(startAnotherFocus).toHaveBeenCalledTimes(1)
  })

  it('"+5 min" chama addTime com 300 segundos', async () => {
    const addTime = vi.fn()
    mockFlexibleTimer({ addTime })
    render(<FlexiblePostFocusChoices />)

    await userEvent.click(screen.getByRole('button', { name: '+5 min' }))

    expect(addTime).toHaveBeenCalledWith(5 * 60)
  })
})
