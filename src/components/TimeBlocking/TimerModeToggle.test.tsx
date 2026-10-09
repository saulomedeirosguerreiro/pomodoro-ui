import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { TimerModeToggle } from './TimerModeToggle'

describe('TimerModeToggle', () => {
  it('renderiza as duas opções, com a atual selecionada', () => {
    render(<TimerModeToggle value="classico" onChange={vi.fn()} />)

    expect(screen.getByRole('tab', { name: 'Pomodoro Clássico', selected: true })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: 'Time Blocking Flexível', selected: false })).toBeInTheDocument()
  })

  it('clicar na outra opção chama onChange com o novo modo', async () => {
    const onChange = vi.fn()
    render(<TimerModeToggle value="classico" onChange={onChange} />)

    await userEvent.click(screen.getByRole('tab', { name: 'Time Blocking Flexível' }))

    expect(onChange).toHaveBeenCalledWith('flexivel')
  })
})
