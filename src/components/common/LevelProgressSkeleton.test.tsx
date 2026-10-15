import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { LevelProgressSkeleton } from './LevelProgressSkeleton'

describe('LevelProgressSkeleton', () => {
  it('renderiza placeholders decorativos pra barra de XP e a contagem', () => {
    const { container } = render(<LevelProgressSkeleton />)

    const placeholders = container.querySelectorAll('[aria-hidden="true"]')
    expect(placeholders).toHaveLength(2)
  })
})
