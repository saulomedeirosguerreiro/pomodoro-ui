import { useMemo, useState } from 'react'
import { Button } from '../common/Button'
import { Dialog } from '../common/Dialog'
import { SegmentedControl, type SegmentedOption } from '../common/SegmentedControl'

export type TimerMode = 'classico' | 'flexivel'

interface TimerModeToggleProps {
  value: TimerMode
  onChange: (mode: TimerMode) => void
  /** `true` enquanto o modo atual está com um período contando — a outra opção fica travada. */
  isLocked?: boolean
  /** `true` enquanto o modo atual está pausado — trocar passa a exigir confirmação (tempo é salvo). */
  requiresConfirmation?: boolean
  /** Chamado ao confirmar a troca com `requiresConfirmation` — tipicamente encerra a sessão atual antes de trocar. */
  onConfirmedChange?: (mode: TimerMode) => void
}

/**
 * Seleção do modo de timer, com trava durante sessão ativa ("Seletor de Modo – Proposta A"):
 * `isLocked` desabilita a troca de verdade (botão nativo `disabled`, sem clique nem teclado) e
 * mostra um aviso `role="status"`; `requiresConfirmation` (pausado) abre um diálogo de confirmação
 * em vez de trocar direto, já que existe tempo focado a perder. Sem nenhum dos dois, troca direta.
 */
export function TimerModeToggle({ value, onChange, isLocked, requiresConfirmation, onConfirmedChange }: TimerModeToggleProps) {
  const [pendingMode, setPendingMode] = useState<TimerMode | null>(null)

  const options = useMemo<SegmentedOption<TimerMode>[]>(
    () => [
      { value: 'classico', label: 'Pomodoro Clássico', disabled: isLocked && value !== 'classico' },
      { value: 'flexivel', label: 'Pomodoro Customizado', disabled: isLocked && value !== 'flexivel' },
    ],
    [isLocked, value],
  )

  function handleChange(nextMode: TimerMode) {
    if (nextMode === value) return

    if (requiresConfirmation) {
      setPendingMode(nextMode)
      return
    }

    onChange(nextMode)
  }

  function handleConfirm() {
    if (!pendingMode) return
    ;(onConfirmedChange ?? onChange)(pendingMode)
    setPendingMode(null)
  }

  return (
    <div className="flex flex-col items-center gap-1">
      <SegmentedControl options={options} value={value} onChange={handleChange} ariaLabel="Modo do timer" />

      {isLocked && (
        <p role="status" className="text-style-label-sm text-text-muted">
          Modo bloqueado durante a sessão. Pause ou encerre para trocar.
        </p>
      )}

      {pendingMode && (
        <Dialog titleText="Trocar de modo?" onDismiss={() => setPendingMode(null)}>
          <p className="text-style-body-sm text-text-muted">
            Trocar de modo vai encerrar a sessão atual. O tempo já focado será salvo.
          </p>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setPendingMode(null)}>
              Continuar sessão
            </Button>
            <Button onClick={handleConfirm}>Trocar e encerrar</Button>
          </div>
        </Dialog>
      )}
    </div>
  )
}
