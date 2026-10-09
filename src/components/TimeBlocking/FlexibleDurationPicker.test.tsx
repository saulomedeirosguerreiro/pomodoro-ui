import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { FlexibleDurationPicker } from './FlexibleDurationPicker'

/** Centro fixo em (130,130) — simplifica a matemática de ângulo nos testes de arrasto. */
function mockRingRect() {
  const ring = screen.getByTestId('flexible-duration-ring')
  vi.spyOn(ring, 'getBoundingClientRect').mockReturnValue({
    left: 0,
    top: 0,
    width: 260,
    height: 260,
    right: 260,
    bottom: 260,
    x: 0,
    y: 0,
    toJSON: () => '',
  })
  return ring
}

describe('FlexibleDurationPicker', () => {
  it('renderiza o selo, o título e o botão de confirmação com a duração escolhida', () => {
    render(
      <FlexibleDurationPicker
        context="foco"
        presets={[5, 25, 45]}
        minMinutes={5}
        maxMinutes={120}
        draftMinutes={25}
        onChoosePreset={vi.fn()}
        onChooseCustom={vi.fn()}
        onConfirm={vi.fn()}
      />,
    )

    expect(screen.getByText('Novo foco')).toBeInTheDocument()
    expect(screen.getByText('Quanto tempo você quer plantar?')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Começar foco de 25 min/ })).toBeInTheDocument()
    expect(screen.getByRole('slider')).toHaveAttribute('aria-valuenow', '25')
  })

  it('mostra o horário de término projetado a partir de agora', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-10-09T14:00:00'))

    render(
      <FlexibleDurationPicker
        context="foco"
        presets={[5, 25, 45]}
        minMinutes={5}
        maxMinutes={120}
        draftMinutes={25}
        onChoosePreset={vi.fn()}
        onChooseCustom={vi.fn()}
        onConfirm={vi.fn()}
      />,
    )

    expect(screen.getByText('Termina às 14:25')).toBeInTheDocument()

    vi.useRealTimers()
  })

  it('clicar num preset da barra segmentada chama onChoosePreset com o valor em minutos', async () => {
    const user = userEvent.setup()
    const onChoosePreset = vi.fn()
    render(
      <FlexibleDurationPicker
        context="foco"
        presets={[5, 25, 45]}
        minMinutes={5}
        maxMinutes={120}
        draftMinutes={25}
        onChoosePreset={onChoosePreset}
        onChooseCustom={vi.fn()}
        onConfirm={vi.fn()}
      />,
    )

    await user.click(screen.getByRole('tab', { name: '45min' }))

    expect(onChoosePreset).toHaveBeenCalledWith(45)
  })

  it('o botão "+" aumenta 5 min e o "−" diminui 5 min, respeitando os limites', async () => {
    const user = userEvent.setup()
    const onChooseCustom = vi.fn()
    render(
      <FlexibleDurationPicker
        context="pausa"
        presets={[5, 10, 15, 20]}
        minMinutes={1}
        maxMinutes={60}
        draftMinutes={58}
        onChoosePreset={vi.fn()}
        onChooseCustom={onChooseCustom}
        onConfirm={vi.fn()}
      />,
    )

    await user.click(screen.getByRole('button', { name: 'Aumentar 5 minutos' }))
    expect(onChooseCustom).toHaveBeenCalledWith(60)

    await user.click(screen.getByRole('button', { name: 'Diminuir 5 minutos' }))
    expect(onChooseCustom).toHaveBeenCalledWith(53)
  })

  it('as setas do teclado no anel ajustam de 1 em 1 minuto, Home/End vão aos limites', async () => {
    const user = userEvent.setup()
    const onChooseCustom = vi.fn()
    render(
      <FlexibleDurationPicker
        context="foco"
        presets={[5, 25, 45]}
        minMinutes={5}
        maxMinutes={120}
        draftMinutes={25}
        onChoosePreset={vi.fn()}
        onChooseCustom={onChooseCustom}
        onConfirm={vi.fn()}
      />,
    )

    screen.getByRole('slider').focus()
    await user.keyboard('{ArrowUp}')
    expect(onChooseCustom).toHaveBeenCalledWith(26)

    await user.keyboard('{ArrowDown}')
    expect(onChooseCustom).toHaveBeenCalledWith(24)

    await user.keyboard('{Home}')
    expect(onChooseCustom).toHaveBeenCalledWith(5)

    await user.keyboard('{End}')
    expect(onChooseCustom).toHaveBeenCalledWith(120)
  })

  it('arrastar o anel até a posição "3 horas" (1/4 de volta) escolhe o minuto correspondente', () => {
    const onChooseCustom = vi.fn()
    render(
      <FlexibleDurationPicker
        context="foco"
        presets={[5, 25, 45]}
        minMinutes={0}
        maxMinutes={100}
        draftMinutes={25}
        onChoosePreset={vi.fn()}
        onChooseCustom={onChooseCustom}
        onConfirm={vi.fn()}
      />,
    )

    const ring = mockRingRect()
    // Centro (130,130); ponto diretamente à direita do centro = 1/4 da volta no sentido horário.
    ring.dispatchEvent(new PointerEvent('pointerdown', { clientX: 230, clientY: 130, pointerId: 1, bubbles: true }))

    expect(onChooseCustom).toHaveBeenCalledWith(25)
  })

  it('clicar em confirmar chama onConfirm', async () => {
    const user = userEvent.setup()
    const onConfirm = vi.fn()
    render(
      <FlexibleDurationPicker
        context="pausa"
        presets={[5, 10, 15, 20]}
        minMinutes={1}
        maxMinutes={60}
        draftMinutes={5}
        onChoosePreset={vi.fn()}
        onChooseCustom={vi.fn()}
        onConfirm={onConfirm}
      />,
    )

    await user.click(screen.getByRole('button', { name: /Começar pausa de 5 min/ }))

    expect(onConfirm).toHaveBeenCalledTimes(1)
  })
})
