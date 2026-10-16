export interface GardenSpecies {
  emoji: string
  /** Chave estável para `t('garden:species.<code>')` — o nome exibido é só uma tradução, nunca a chave. */
  code: string
}

/** Rotação determinística de espécies (G-Q12=A): sem tabela nova, só a posição do foco no dia. */
export const GARDEN_SPECIES: readonly GardenSpecies[] = [
  { emoji: '🍅', code: 'tomatinho' },
  { emoji: '🍓', code: 'moranguinho' },
  { emoji: '🌵', code: 'cactoZen' },
  { emoji: '🌻', code: 'girassol' },
  { emoji: '🍄', code: 'cogumelo' },
]

export function speciesForIndex(index: number): GardenSpecies {
  return GARDEN_SPECIES[index % GARDEN_SPECIES.length]
}
