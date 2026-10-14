import { SegmentedControl, type SegmentedOption } from '../common/SegmentedControl'

export type FlexibleModeToggleValue = 'foco' | 'pausa'

const OPTIONS: SegmentedOption<FlexibleModeToggleValue>[] = [
  { value: 'foco', label: '🌱 Foco' },
  { value: 'pausa', label: '☕ Pausa' },
]

interface FlexibleModeToggleProps {
  value: FlexibleModeToggleValue
  onSwitch: () => void
}

/**
 * Toggle Foco/Pausa único e sempre visível no modo flexível — mesmo controle nas telas de escolher
 * duração (`FlexibleDurationPicker`) e nas de bloco rodando/pausado (`FlexibleFocusView`/
 * `FlexibleBreakView`), no lugar de botões dedicados tipo "Voltar ao foco agora": trocar de aba É a
 * ação, sem duplicar o mesmo efeito em dois controles diferentes.
 */
export function FlexibleModeToggle({ value, onSwitch }: FlexibleModeToggleProps) {
  return (
    <SegmentedControl
      options={OPTIONS}
      value={value}
      onChange={(next) => {
        if (next !== value) onSwitch()
      }}
      ariaLabel="Foco ou pausa"
    />
  )
}
