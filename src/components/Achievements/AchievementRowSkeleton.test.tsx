import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { AchievementRowSkeleton } from './AchievementRowSkeleton'

describe('AchievementRowSkeleton', () => {
  it('renderiza como decorativo, sem texto real', () => {
    const { container } = render(
      <ul>
        <AchievementRowSkeleton />
      </ul>,
    )

    expect(container.querySelector('li')).toHaveAttribute('aria-hidden', 'true')
  })

  it('locked adiciona a barra de progresso placeholder', () => {
    const { container } = render(
      <ul>
        <AchievementRowSkeleton locked />
      </ul>,
    )

    expect(container.querySelectorAll('li > div > span')).toHaveLength(3)
  })
})
