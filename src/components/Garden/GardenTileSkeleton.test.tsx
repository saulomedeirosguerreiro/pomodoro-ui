import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { GardenTileSkeleton } from './GardenTileSkeleton'

describe('GardenTileSkeleton', () => {
  it('renderiza como decorativo, sem texto real', () => {
    const { container } = render(<GardenTileSkeleton />)

    expect(container.firstChild).toHaveAttribute('aria-hidden', 'true')
  })
})
