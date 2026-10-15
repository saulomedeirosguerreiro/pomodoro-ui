import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { Skeleton } from './Skeleton'

describe('Skeleton', () => {
  it('renderiza como decorativo (aria-hidden), invisível pra leitor de tela', () => {
    const { container } = render(<Skeleton />)

    expect(container.firstChild).toHaveAttribute('aria-hidden', 'true')
  })

  it('variant="rect" usa cantos arredondados em retângulo', () => {
    const { container } = render(<Skeleton variant="rect" width={100} height={20} />)

    expect(container.firstChild).toHaveClass('rounded-lg')
  })

  it('variant="circle" usa cantos totalmente arredondados', () => {
    const { container } = render(<Skeleton variant="circle" width={40} height={40} />)

    expect(container.firstChild).toHaveClass('rounded-full')
  })

  it('variant="text" sem lines renderiza uma única linha', () => {
    const { container } = render(<Skeleton variant="text" />)

    expect(container.querySelectorAll('span')).toHaveLength(1)
  })

  it('variant="text" com lines empilha múltiplas linhas, a última mais curta', () => {
    const { container } = render(<Skeleton variant="text" lines={3} />)

    const rows = container.querySelectorAll('span > span')
    expect(rows).toHaveLength(3)
    expect(rows[rows.length - 1]).toHaveClass('w-2/3')
  })
})
