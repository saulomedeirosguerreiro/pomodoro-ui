import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { HistoryRowSkeleton } from './HistoryRowSkeleton'

describe('HistoryRowSkeleton', () => {
  it('renderiza como decorativo, sem texto real', () => {
    const { container } = render(
      <ul>
        <HistoryRowSkeleton />
      </ul>,
    )

    expect(container.querySelector('li')).toHaveAttribute('aria-hidden', 'true')
  })
})
