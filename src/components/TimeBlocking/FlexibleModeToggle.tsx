import { SegmentedControl, type SegmentedOption } from '../common/SegmentedControl'

export type FlexibleModeToggleValue = 'foco' | 'pausa'

const OPTIONS: SegmentedOption<FlexibleModeToggleValue>[] = [
  { value: 'foco', label: '🌱 Foco' },
  { value: 'pausa', label: '☕ Pausa' },
]

interface FlexibleModeToggleProps {
  value: FlexibleModeToggleValue
  onChange: (next: FlexibleModeToggleValue) => void
}

/**
 * Toggle Foco/Pausa único no modo flexível — mesmo controle nas telas de escolher duração
 * (`FlexibleDurationPicker`), nas de bloco rodando/pausado (`FlexibleFocusView`/`FlexibleBreakView`)
 * e nas de decisão pós-bloco (`FlexiblePostFocusChoices`/`FlexiblePostBreakChoices`). Dispara
 * `onChange` em QUALQUER clique, até no tab já "ativo" (mesmo comportamento de `SegmentedControl`) —
 * quem chama decide o que cada lado faz, inclusive quando clicar no já-ativo deve ser um no-op
 * (ex.: durante um bloco rodando) ou deve agir mesmo assim (ex.: nas telas de decisão, onde clicar
 * de novo no tipo que acabou de concluir abre uma nova duração do mesmo tipo).
 */
export function FlexibleModeToggle({ value, onChange }: FlexibleModeToggleProps) {
  return <SegmentedControl options={OPTIONS} value={value} onChange={onChange} ariaLabel="Foco ou pausa" />
}
