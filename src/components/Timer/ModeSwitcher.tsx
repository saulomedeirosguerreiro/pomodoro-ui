import { useMemo } from 'react'
import { useSettings } from '../../context/SettingsContext'
import type { SessionType } from '../../types/api'
import { SegmentedControl, type SegmentedOption } from '../common/SegmentedControl'
import type { TimerPhase } from './useTimer'

interface ModeSwitcherProps {
  type: SessionType
  phase: TimerPhase
  onSelectType: (type: SessionType) => void
}

/** Seleção manual de modo (US-33, G-Q5/G-Q5a): troca livre, com confirmação se o timer estiver rodando/pausado. */
export function ModeSwitcher({ type, phase, onSelectType }: ModeSwitcherProps) {
  const { settings } = useSettings()

  const options = useMemo<SegmentedOption<SessionType>[]>(
    () => [
      { value: 'foco', label: `Foco ${settings.focusMinutes}m` },
      { value: 'descanso_curto', label: `Pausa Curta ${settings.shortBreakMinutes}m` },
      { value: 'descanso_longo', label: `Pausa Longa ${settings.longBreakMinutes}m` },
    ],
    [settings.focusMinutes, settings.shortBreakMinutes, settings.longBreakMinutes],
  )

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

  return <SegmentedControl options={options} value={type} onChange={handleChange} ariaLabel="Tipo de período" />
}
