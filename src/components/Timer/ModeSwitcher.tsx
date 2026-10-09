import { useMemo, useState } from 'react'
import { useSettings } from '../../context/SettingsContext'
import type { SessionType } from '../../types/api'
import { Button } from '../common/Button'
import { Dialog } from '../common/Dialog'
import { SegmentedControl, type SegmentedOption } from '../common/SegmentedControl'
import type { TimerPhase } from './useTimer'

interface ModeSwitcherProps {
  type: SessionType
  phase: TimerPhase
  onSelectType: (type: SessionType) => void
}

/**
 * Seleção manual de tipo de período (US-33, G-Q5/G-Q5a) — trava durante sessão ativa ("Seletor de
 * Modo – Proposta A", mesmo padrão de `TimerModeToggle`): `rodando` desabilita as outras abas de
 * verdade (sem clique/teclado) com aviso `role="status"`; `pausado` abre um diálogo de confirmação
 * em vez do `window.confirm` nativo de antes; `parado` troca direto, sem diálogo.
 */
export function ModeSwitcher({ type, phase, onSelectType }: ModeSwitcherProps) {
  const { settings } = useSettings()
  const [pendingType, setPendingType] = useState<SessionType | null>(null)

  const isLocked = phase === 'rodando'
  const requiresConfirmation = phase === 'pausado'

  const options = useMemo<SegmentedOption<SessionType>[]>(
    () => [
      { value: 'foco', label: `Foco ${settings.focusMinutes}m`, disabled: isLocked && type !== 'foco' },
      {
        value: 'descanso_curto',
        label: `Pausa Curta ${settings.shortBreakMinutes}m`,
        disabled: isLocked && type !== 'descanso_curto',
      },
      {
        value: 'descanso_longo',
        label: `Pausa Longa ${settings.longBreakMinutes}m`,
        disabled: isLocked && type !== 'descanso_longo',
      },
    ],
    [settings.focusMinutes, settings.shortBreakMinutes, settings.longBreakMinutes, isLocked, type],
  )

  function handleChange(nextType: SessionType) {
    if (nextType === type) return

    if (requiresConfirmation) {
      setPendingType(nextType)
      return
    }

    onSelectType(nextType)
  }

  function handleConfirm() {
    if (!pendingType) return
    onSelectType(pendingType)
    setPendingType(null)
  }

  return (
    <div className="flex flex-col items-center gap-1">
      <SegmentedControl options={options} value={type} onChange={handleChange} ariaLabel="Tipo de período" />

      {isLocked && (
        <p role="status" className="text-style-label-sm text-text-muted">
          Modo bloqueado durante a sessão. Pause ou encerre para trocar.
        </p>
      )}

      {pendingType && (
        <Dialog titleText="Trocar de modo?" onDismiss={() => setPendingType(null)}>
          <p className="text-style-body-sm text-text-muted">
            Trocar de modo vai encerrar a sessão atual. O tempo já focado será salvo.
          </p>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setPendingType(null)}>
              Continuar sessão
            </Button>
            <Button onClick={handleConfirm}>Trocar e encerrar</Button>
          </div>
        </Dialog>
      )}
    </div>
  )
}
