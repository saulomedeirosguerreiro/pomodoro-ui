import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { TimerModeToggle } from './TimerModeToggle'

describe('TimerModeToggle', () => {
  it('renderiza as duas opções, com a atual selecionada', () => {
    render(<TimerModeToggle value="classico" onChange={vi.fn()} />)

    expect(screen.getByRole('tab', { name: 'Pomodoro Clássico', selected: true })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: 'Customizado', selected: false })).toBeInTheDocument()
  })

  it('clicar na outra opção chama onChange com o novo modo', async () => {
    const onChange = vi.fn()
    render(<TimerModeToggle value="classico" onChange={onChange} />)

    await userEvent.click(screen.getByRole('tab', { name: 'Customizado' }))

    expect(onChange).toHaveBeenCalledWith('flexivel')
  })

  it('isLocked marca a outra opção como aria-disabled, mostra o tooltip e ignora o clique', async () => {
    const onChange = vi.fn()
    render(<TimerModeToggle value="classico" onChange={onChange} isLocked />)

    const flexivelTab = screen.getByRole('tab', { name: 'Customizado' })
    expect(flexivelTab).toHaveAttribute('aria-disabled', 'true')
    // continua focável de propósito — travar não pode tirar o card da ordem de Tab, porque o
    // tooltip também precisa aparecer chegando nele com teclado, não só no hover do mouse.
    expect(flexivelTab).not.toBeDisabled()

    expect(screen.getByRole('tooltip')).toHaveTextContent(
      'Modo travado enquanto a sessão está rodando, no foco ou na pausa, para não perder seu ciclo. Encerre a sessão para trocar.',
    )

    await userEvent.click(flexivelTab)
    expect(onChange).not.toHaveBeenCalled()
  })

  it('isLocked não trava a opção já ativa', () => {
    render(<TimerModeToggle value="classico" onChange={vi.fn()} isLocked />)

    const classicoTab = screen.getByRole('tab', { name: 'Pomodoro Clássico' })
    expect(classicoTab).not.toHaveAttribute('aria-disabled')
  })

  it('sem isLocked, não existe tooltip nenhum', () => {
    render(<TimerModeToggle value="classico" onChange={vi.fn()} />)

    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument()
  })
})
