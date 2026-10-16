import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '../common/Button'
import { Dialog } from '../common/Dialog'
import type { SessionType } from '../../types/api'
import type { TimerPhase } from './useTimer'

const ICON_BUTTON_CLASSES =
  'flex h-14 w-14 cursor-pointer items-center justify-center rounded-full border-2 border-border bg-surface text-[22px] text-text-muted transition-[background-color,transform] duration-150 ease-out hover:bg-bg-subtle active:scale-95'

interface TimerControlsProps {
  type: SessionType
  phase: TimerPhase
  canFinalize: boolean
  onStart: () => void
  onPause: () => void
  onResume: () => void
  onRestart: () => void
  onFinalize: () => void
}

export function TimerControls({
  type,
  phase,
  canFinalize,
  onStart,
  onPause,
  onResume,
  onRestart,
  onFinalize,
}: TimerControlsProps) {
  const { t } = useTranslation('timer')
  const [confirmingFinalize, setConfirmingFinalize] = useState(false)

  function handleConfirmFinalize() {
    onFinalize()
    setConfirmingFinalize(false)
  }

  const startLabel = type === 'foco' ? t('controls.startFocus') : t('controls.startBreak')

  return (
    <div className="flex flex-wrap items-center justify-center gap-4 pb-6">
      <button
        type="button"
        className={ICON_BUTTON_CLASSES}
        onClick={onRestart}
        title={t('controls.restartSession')}
        aria-label={t('controls.restartSession')}
      >
        ↺
      </button>

      {phase === 'rodando' ? (
        <Button onClick={onPause}>{t('controls.pause')}</Button>
      ) : phase === 'pausado' ? (
        <Button onClick={onResume}>{t('controls.resume')}</Button>
      ) : (
        <Button onClick={onStart}>{startLabel}</Button>
      )}

      <Button variant="ghost" onClick={() => setConfirmingFinalize(true)} disabled={!canFinalize}>
        {t('controls.finalize')}
      </Button>

      {confirmingFinalize && (
        <Dialog titleText={t('controls.finalizeDialog.title')} onDismiss={() => setConfirmingFinalize(false)}>
          <p className="mb-4 text-style-body-sm text-text-muted">{t('controls.finalizeDialog.body')}</p>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setConfirmingFinalize(false)}>
              {t('controls.finalizeDialog.cancel')}
            </Button>
            <Button onClick={handleConfirmFinalize}>{t('controls.finalizeDialog.confirm')}</Button>
          </div>
        </Dialog>
      )}
    </div>
  )
}
