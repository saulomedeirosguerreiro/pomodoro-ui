import { describe, expect, it } from 'vitest'
import { speciesForIndex } from './gardenSpecies'

describe('speciesForIndex', () => {
  it('é determinística para o mesmo índice', () => {
    expect(speciesForIndex(0)).toEqual(speciesForIndex(0))
  })

  it('roda entre as espécies ao passar do fim da lista', () => {
    const first = speciesForIndex(0)
    const wrapped = speciesForIndex(5)

    expect(wrapped).toEqual(first)
  })

  it('índices diferentes dentro da lista dão espécies diferentes', () => {
    expect(speciesForIndex(0)).not.toEqual(speciesForIndex(1))
  })
})
