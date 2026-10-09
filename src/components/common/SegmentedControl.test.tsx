import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { SegmentedControl, type SegmentedOption } from './SegmentedControl'

const OPTIONS: SegmentedOption<'a' | 'b'>[] = [
  { value: 'a', label: 'Opção A' },
  { value: 'b', label: 'Opção B', disabled: true },
]

describe('SegmentedControl', () => {
  it('opção disabled recebe o atributo disabled e mostra o cadeado', () => {
    render(<SegmentedControl options={OPTIONS} value="a" onChange={vi.fn()} ariaLabel="Teste" />)

    const optionB = screen.getByRole('tab', { name: /Opção B/ })
    expect(optionB).toBeDisabled()
    expect(optionB).toHaveTextContent('🔒')
  })

  it('opção habilitada não mostra o cadeado nem fica disabled', () => {
    render(<SegmentedControl options={OPTIONS} value="a" onChange={vi.fn()} ariaLabel="Teste" />)

    const optionA = screen.getByRole('tab', { name: 'Opção A' })
    expect(optionA).not.toBeDisabled()
    expect(optionA).not.toHaveTextContent('🔒')
  })

  it('clicar numa opção disabled não chama onChange', async () => {
    const onChange = vi.fn()
    render(<SegmentedControl options={OPTIONS} value="a" onChange={onChange} ariaLabel="Teste" />)

    await userEvent.click(screen.getByRole('tab', { name: /Opção B/ }))

    expect(onChange).not.toHaveBeenCalled()
  })

  it('clicar numa opção habilitada chama onChange', async () => {
    const onChange = vi.fn()
    render(<SegmentedControl options={OPTIONS} value="a" onChange={onChange} ariaLabel="Teste" />)

    await userEvent.click(screen.getByRole('tab', { name: 'Opção A' }))

    expect(onChange).toHaveBeenCalledWith('a')
  })
})
