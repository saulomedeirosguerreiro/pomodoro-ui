import { useMemo } from 'react'
import { SegmentedControl, type SegmentedOption } from '../common/SegmentedControl'

export type TimerMode = 'classico' | 'flexivel'

interface TimerModeToggleProps {
  value: TimerMode
  onChange: (mode: TimerMode) => void
}

/** Seleção do modo de timer (Parte 5 do plano) — reaproveita o `SegmentedControl` genérico, sem CSS novo. */
export function TimerModeToggle({ value, onChange }: TimerModeToggleProps) {
  const options = useMemo<SegmentedOption<TimerMode>[]>(
    () => [
      { value: 'classico', label: 'Pomodoro Clássico' },
      { value: 'flexivel', label: 'Pomodoro Customizado' },
    ],
    [],
  )

  return <SegmentedControl options={options} value={value} onChange={onChange} ariaLabel="Modo do timer" />
}
