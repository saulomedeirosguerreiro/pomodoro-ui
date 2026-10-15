import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { TaskCardSkeleton } from './TaskCardSkeleton'

describe('TaskCardSkeleton', () => {
  it('renderiza como decorativo, sem texto real', () => {
    const { container } = render(
      <ul>
        <TaskCardSkeleton />
      </ul>,
    )

    expect(container.querySelector('li')).toHaveAttribute('aria-hidden', 'true')
  })
})
