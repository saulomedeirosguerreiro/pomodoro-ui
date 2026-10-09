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
  const { focusBlocksCompleted, totalFocusSecondsCompleted, startNewSession } = useFlexibleTimerContext()

  return (
    <section className="flex w-full flex-col items-center gap-4 rounded-2xl border border-border bg-surface p-6 text-center shadow-card">
      <h2 className="text-style-headline-sm text-text-h">Sessão encerrada 🌼</h2>
      <p className="text-style-body-md text-text-muted">
        {focusBlocksCompleted > 0
          ? `Você completou ${focusBlocksCompleted} ${focusBlocksCompleted === 1 ? 'foco' : 'focos'} (${formatMMSS(totalFocusSecondsCompleted)}). Bom trabalho!`
          : 'Até a próxima sessão!'}
      </p>
      <Button onClick={startNewSession}>Começar nova sessão</Button>
    </section>
  )
}

/**
 * Componente de composição do modo flexível (Parte 5 do plano) — escolhe qual tela renderizar a
 * partir de `flexibleTimer.phase.kind`, mais `TodaysGardenCard` (reuso direto, agnóstico a modo) e o
 * mesmo bloco de erro de registro já usado em `ClassicTimerView`.
 */
export function FlexibleTimerView() {
  const flexible = useFlexibleTimerContext()
  const { phase, progress, registrationError, retryRegistration } = flexible

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
        />
      )}

      {(phase.kind === 'descanso_rodando' || phase.kind === 'descanso_pausado') && <FlexibleBreakView />}

      {phase.kind === 'descanso_concluido' && <FlexiblePostBreakChoices />}

      {phase.kind === 'encerrado' && <EndedSummary />}

      {registrationError && (
        <div className="flex w-full flex-col items-center gap-2 rounded-lg bg-danger-bg p-4 text-center text-danger">
          <p>{registrationError}</p>
          <Button variant="ghost" onClick={retryRegistration}>
            Tentar novamente
          </Button>
        </div>
      )}

      <TodaysGardenCard
        maturedCount={progress?.todayFocusCount ?? 0}
        isGrowing={phase.kind === 'foco_rodando'}
      />
    </>
  )
}
