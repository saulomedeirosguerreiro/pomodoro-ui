import { useTranslation } from 'react-i18next'
import { useFlexibleTimerContext } from '../../context/FlexibleTimerContext'
import {
  FLEXIBLE_BREAK_MAX_MINUTES,
  FLEXIBLE_BREAK_MIN_MINUTES,
  FLEXIBLE_BREAK_PRESETS_MINUTES,
  FLEXIBLE_FOCUS_MAX_MINUTES,
  FLEXIBLE_FOCUS_MIN_MINUTES,
  FLEXIBLE_FOCUS_PRESETS_MINUTES,
  formatMMSS,
} from '../../lib/timerLogic'
import { Button } from '../common/Button'
import { TodaysGardenCard } from '../Garden/TodaysGardenCard'
import { FlexibleBreakView } from './FlexibleBreakView'
import { FlexibleDurationPicker } from './FlexibleDurationPicker'
import { FlexibleFocusView } from './FlexibleFocusView'
import { FlexiblePostBreakChoices } from './FlexiblePostBreakChoices'
import { FlexiblePostFocusChoices } from './FlexiblePostFocusChoices'

/** "Sessão encerrada": resumo mínimo + botão para recomeçar (único texto próprio deste componente, sem arquivo dedicado no plano). */
function EndedSummary() {
  const { t } = useTranslation('timer')
  const { focusBlocksCompleted, totalFocusSecondsCompleted, startNewSession } = useFlexibleTimerContext()

  return (
    <section className="flex w-full flex-col items-center gap-4 rounded-2xl border border-border bg-surface p-6 text-center shadow-card">
      <h2 className="text-style-headline-sm text-text-h">{t('flexibleEnded.title')}</h2>
      <p className="text-style-body-md text-text-muted">
        {focusBlocksCompleted > 0
          ? t('flexibleEnded.summary', {
              count: focusBlocksCompleted,
              duration: formatMMSS(totalFocusSecondsCompleted),
            })
          : t('flexibleEnded.noFocus')}
      </p>
      <Button onClick={startNewSession}>{t('flexibleEnded.startNew')}</Button>
    </section>
  )
}

/**
 * Componente de composição do modo flexível (Parte 5 do plano) — escolhe qual tela renderizar a
 * partir de `flexibleTimer.phase.kind`, mais `TodaysGardenCard` (reuso direto, agnóstico a modo) e o
 * mesmo bloco de erro de registro já usado em `ClassicTimerView`.
 */
export function FlexibleTimerView() {
  const { t } = useTranslation('timer')
  const flexible = useFlexibleTimerContext()
  const { phase, progress, registrationError, retryRegistration, dismissRegistrationError, canRetryRegistration } = flexible

  return (
    <>
      {phase.kind === 'selecionando_foco' && (
        <FlexibleDurationPicker
          context="foco"
          presets={FLEXIBLE_FOCUS_PRESETS_MINUTES}
          minMinutes={FLEXIBLE_FOCUS_MIN_MINUTES}
          maxMinutes={FLEXIBLE_FOCUS_MAX_MINUTES}
          draftMinutes={flexible.draftMinutes}
          onChoosePreset={flexible.chooseFocusPreset}
          onChooseCustom={flexible.chooseFocusCustom}
          onConfirm={flexible.startFocus}
          onSwitchContext={flexible.startBreak}
        />
      )}

      {(phase.kind === 'foco_rodando' || phase.kind === 'foco_pausado') && <FlexibleFocusView />}

      {phase.kind === 'foco_concluido' && <FlexiblePostFocusChoices />}

      {phase.kind === 'selecionando_descanso' && (
        <FlexibleDurationPicker
          context="pausa"
          presets={FLEXIBLE_BREAK_PRESETS_MINUTES}
          minMinutes={FLEXIBLE_BREAK_MIN_MINUTES}
          maxMinutes={FLEXIBLE_BREAK_MAX_MINUTES}
          draftMinutes={flexible.draftMinutes}
          onChoosePreset={flexible.chooseBreakPreset}
          onChooseCustom={flexible.chooseBreakCustom}
          onConfirm={flexible.startBreak}
          onSwitchContext={flexible.cancelBreakSelection}
        />
      )}

      {(phase.kind === 'descanso_rodando' || phase.kind === 'descanso_pausado') && <FlexibleBreakView />}

      {phase.kind === 'descanso_concluido' && <FlexiblePostBreakChoices />}

      {phase.kind === 'encerrado' && <EndedSummary />}

      {registrationError && (
        <div className="relative flex w-full flex-col items-center gap-2 rounded-lg bg-danger-bg p-4 pr-10 text-center text-danger">
          <button
            type="button"
            onClick={dismissRegistrationError}
            className="absolute right-2 top-2 flex h-6 w-6 cursor-pointer items-center justify-center rounded-full text-danger"
            aria-label={t('dismissWarning')}
          >
            ✕
          </button>
          <p>{registrationError}</p>
          {canRetryRegistration && (
            <Button variant="ghost" onClick={retryRegistration}>
              {t('retryRegistration')}
            </Button>
          )}
        </div>
      )}

      <TodaysGardenCard
        maturedCount={progress?.todayFocusCount ?? 0}
        isGrowing={phase.kind === 'foco_rodando'}
      />
    </>
  )
}
