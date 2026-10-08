export interface GardenSpecies {
  emoji: string
  name: string
}

/** Rotação determinística de espécies (G-Q12=A): sem tabela nova, só a posição do foco no dia. */
export const GARDEN_SPECIES: readonly GardenSpecies[] = [
  { emoji: '🍅', name: 'Tomatinho' },
  { emoji: '🍓', name: 'Moranguinho' },
  { emoji: '🌵', name: 'Cacto Zen' },
  { emoji: '🌻', name: 'Girassol' },
  { emoji: '🍄', name: 'Cogumelo' },
]

export function speciesForIndex(index: number): GardenSpecies {
  return GARDEN_SPECIES[index % GARDEN_SPECIES.length]
}
