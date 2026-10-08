import { SegmentedControl, type SegmentedOption } from '../common/SegmentedControl'
import type { TimerPhase } from './useTimer'
import type { SessionType } from '../../types/api'

const MODE_OPTIONS: SegmentedOption<SessionType>[] = [
  { value: 'foco', label: 'Foco 25m' },
  { value: 'descanso_curto', label: 'Pausa Curta 5m' },
  { value: 'descanso_longo', label: 'Pausa Longa 15m' },
]

interface ModeSwitcherProps {
  type: SessionType
  phase: TimerPhase
  onSelectType: (type: SessionType) => void
}

/** Seleção manual de modo (US-33, G-Q5/G-Q5a): troca livre, com confirmação se o timer estiver rodando/pausado. */
export function ModeSwitcher({ type, phase, onSelectType }: ModeSwitcherProps) {
  function handleChange(nextType: SessionType) {
    if (nextType === type) return

    if (phase !== 'parado') {
      const confirmed = window.confirm(
        'Trocar de modo agora? O período atual será registrado como interrompido, com o tempo que você já focou.',
      )
      if (!confirmed) return
    }

    onSelectType(nextType)
  }

  return <SegmentedControl options={MODE_OPTIONS} value={type} onChange={handleChange} ariaLabel="Tipo de período" />
}
