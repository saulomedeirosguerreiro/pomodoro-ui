import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { TimerModeToggle } from './TimerModeToggle'

describe('TimerModeToggle', () => {
  it('renderiza as duas opções, com a atual selecionada', () => {
    render(<TimerModeToggle value="classico" onChange={vi.fn()} />)

    expect(screen.getByRole('tab', { name: 'Pomodoro Clássico', selected: true })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: 'Pomodoro Customizado', selected: false })).toBeInTheDocument()
  })

  it('clicar na outra opção chama onChange com o novo modo', async () => {
    const onChange = vi.fn()
    render(<TimerModeToggle value="classico" onChange={onChange} />)

    await userEvent.click(screen.getByRole('tab', { name: 'Pomodoro Customizado' }))

    expect(onChange).toHaveBeenCalledWith('flexivel')
  })

  it('isLocked desabilita a outra opção e mostra o aviso role="status"', async () => {
    const onChange = vi.fn()
    render(<TimerModeToggle value="classico" onChange={onChange} isLocked />)

    const flexivelTab = screen.getByRole('tab', { name: 'Pomodoro Customizado' })
    expect(flexivelTab).toBeDisabled()
    expect(screen.getByRole('status')).toHaveTextContent('Modo bloqueado durante a sessão. Pause ou encerre para trocar.')

    await userEvent.click(flexivelTab)
    expect(onChange).not.toHaveBeenCalled()
  })

  it('isLocked não desabilita a opção já ativa', () => {
    render(<TimerModeToggle value="classico" onChange={vi.fn()} isLocked />)

    expect(screen.getByRole('tab', { name: 'Pomodoro Clássico' })).not.toBeDisabled()
  })

  it('requiresConfirmation abre um diálogo em vez de trocar direto', async () => {
    const onChange = vi.fn()
    const onConfirmedChange = vi.fn()
    render(<TimerModeToggle value="classico" onChange={onChange} requiresConfirmation onConfirmedChange={onConfirmedChange} />)

    await userEvent.click(screen.getByRole('tab', { name: 'Pomodoro Customizado' }))

    expect(screen.getByText('Trocar de modo vai encerrar a sessão atual. O tempo já focado será salvo.')).toBeInTheDocument()
    expect(onChange).not.toHaveBeenCalled()
    expect(onConfirmedChange).not.toHaveBeenCalled()
  })

  it('confirmar a troca chama onConfirmedChange com o modo pendente', async () => {
    const onConfirmedChange = vi.fn()
    render(<TimerModeToggle value="classico" onChange={vi.fn()} requiresConfirmation onConfirmedChange={onConfirmedChange} />)

    await userEvent.click(screen.getByRole('tab', { name: 'Pomodoro Customizado' }))
    await userEvent.click(screen.getByRole('button', { name: 'Trocar e encerrar' }))

    expect(onConfirmedChange).toHaveBeenCalledWith('flexivel')
  })

  it('cancelar a confirmação não chama onChange nem onConfirmedChange', async () => {
    const onChange = vi.fn()
    const onConfirmedChange = vi.fn()
    render(<TimerModeToggle value="classico" onChange={onChange} requiresConfirmation onConfirmedChange={onConfirmedChange} />)

    await userEvent.click(screen.getByRole('tab', { name: 'Pomodoro Customizado' }))
    await userEvent.click(screen.getByRole('button', { name: 'Continuar sessão' }))

    expect(screen.queryByText('Trocar de modo vai encerrar a sessão atual. O tempo já focado será salvo.')).not.toBeInTheDocument()
    expect(onChange).not.toHaveBeenCalled()
    expect(onConfirmedChange).not.toHaveBeenCalled()
  })

  it('sem onConfirmedChange, confirmar cai em onChange diretamente', async () => {
    const onChange = vi.fn()
    render(<TimerModeToggle value="classico" onChange={onChange} requiresConfirmation />)

    await userEvent.click(screen.getByRole('tab', { name: 'Pomodoro Customizado' }))
    await userEvent.click(screen.getByRole('button', { name: 'Trocar e encerrar' }))

    expect(onChange).toHaveBeenCalledWith('flexivel')
  })
})
