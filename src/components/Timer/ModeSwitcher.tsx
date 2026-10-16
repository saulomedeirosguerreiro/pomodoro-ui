import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useSettings } from '../../context/SettingsContext'
import { sessionLabel } from '../../lib/timerLogic'
import type { SessionType } from '../../types/api'
import { Button } from '../common/Button'
import { Dialog } from '../common/Dialog'
import { SegmentedControl, type SegmentedOption } from '../common/SegmentedControl'
import type { TimerPhase } from './useTimer'

interface ModeSwitcherProps {
  type: SessionType
  phase: TimerPhase
  /** Único próximo tipo válido na sequência clássica (vindo de `useTimer`) — a troca manual só pode
   *  ir para ele (ou ficar no atual), nunca pular a sequência Foco → Pausa curta ×3 → Pausa longa. */
  suggestedNextType: SessionType
  onSelectType: (type: SessionType) => void
}

/**
 * Seleção manual de tipo de período (US-33, G-Q5/G-Q5a) — trava durante sessão ativa ("Seletor de
 * Modo – Proposta A", mesmo padrão de `TimerModeToggle`): `rodando` desabilita as outras abas de
 * verdade (sem clique/teclado) com aviso `role="status"`; `pausado` abre um diálogo de confirmação
 * em vez do `window.confirm` nativo de antes; `parado` troca direto, sem diálogo.
 *
 * Fora da sessão ativa, a troca manual também é travada para a sequência clássica (US-33b): só o
 * tipo atual e `suggestedNextType` ficam clicáveis, as demais abas mostram cadeado + aviso — o
 * Clássico não permite pular etapas nem repetir a pausa longa fora do 4º ciclo.
 */
export function ModeSwitcher({ type, phase, suggestedNextType, onSelectType }: ModeSwitcherProps) {
  const { t } = useTranslation('timer')
  const { settings } = useSettings()
  const [pendingType, setPendingType] = useState<SessionType | null>(null)

  const isLocked = phase === 'rodando'
  const requiresConfirmation = phase === 'pausado'
  const sequenceDisabledReason = t('modeSwitcher.sequenceLockedReason')

  const options = useMemo<SegmentedOption<SessionType>[]>(() => {
    function buildOption(value: SessionType, label: string): SegmentedOption<SessionType> {
      if (isLocked) {
        return { value, label, disabled: type !== value }
      }
      const outOfSequence = value !== type && value !== suggestedNextType
      return { value, label, disabled: outOfSequence, disabledReason: sequenceDisabledReason }
    }

    return [
      buildOption('foco', t('modeSwitcher.optionFoco', { minutes: settings.focusMinutes })),
      buildOption('descanso_curto', t('modeSwitcher.optionShortBreak', { minutes: settings.shortBreakMinutes })),
      buildOption('descanso_longo', t('modeSwitcher.optionLongBreak', { minutes: settings.longBreakMinutes })),
    ]
  }, [
    settings.focusMinutes,
    settings.shortBreakMinutes,
    settings.longBreakMinutes,
    isLocked,
    type,
    suggestedNextType,
    sequenceDisabledReason,
    t,
  ])

  const hasSequenceLock = !isLocked && options.some((option) => option.disabled)

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
      <SegmentedControl options={options} value={type} onChange={handleChange} ariaLabel={t('modeSwitcher.ariaLabel')} />

      {isLocked && (
        <p role="status" className="text-style-label-sm text-text-muted">
          {t('modeSwitcher.locked')}
        </p>
      )}

      {hasSequenceLock && (
        <p role="status" className="text-style-label-sm text-text-muted">
          {t('modeSwitcher.sequenceNotice', { nextLabel: sessionLabel(t, suggestedNextType) })}
        </p>
      )}

      {pendingType && (
        <Dialog titleText={t('modeSwitcher.confirmDialog.title')} onDismiss={() => setPendingType(null)}>
          <p className="mb-4 text-style-body-sm text-text-muted">{t('modeSwitcher.confirmDialog.body')}</p>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setPendingType(null)}>
              {t('modeSwitcher.confirmDialog.cancel')}
            </Button>
            <Button onClick={handleConfirm}>{t('modeSwitcher.confirmDialog.confirm')}</Button>
          </div>
        </Dialog>
      )}
    </div>
  )
}
