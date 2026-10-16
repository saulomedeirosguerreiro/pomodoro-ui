import { useTranslation } from 'react-i18next'
import { Button } from '../common/Button'
import { useFlexibleTimerContext } from '../../context/FlexibleTimerContext'
import { speciesForIndex } from '../../lib/gardenSpecies'

const ADD_TIME_OPTIONS_MINUTES = [5, 10] as const

const PILL_BUTTON_CLASSES =
  'cursor-pointer rounded-full bg-secondary-bg px-4 py-2 text-style-label-md text-secondary-dark transition-colors duration-150 ease-out hover:bg-secondary hover:text-on-secondary'

/**
 * Decisão pós-foco (Parte 5 do plano, redesenhada a pedido do usuário) — sem avanço automático.
 * Dois botões lado a lado (não um toggle/segmented control): aqui não existe "modo atual" pra
 * destacar como ativo — é uma escolha nova a cada vez, então os dois lados têm o mesmo peso visual.
 * "Finalizar tempo" saiu daqui e mora na tela de escolher duração (`FlexibleDurationPicker`).
 * A espécie exibida é a que acabou de "nascer": `focusBlocksCompleted` já foi incrementado no
 * momento da conclusão natural (`useFlexibleTimer`), então o índice do bloco recém-concluído é
 * `focusBlocksCompleted - 1`.
 */
export function FlexiblePostFocusChoices() {
  const { t } = useTranslation('timer')
  const { startBreak, startAnotherFocus, addTime, focusBlocksCompleted } = useFlexibleTimerContext()
  const species = speciesForIndex(Math.max(0, focusBlocksCompleted - 1))

  return (
    <section className="flex w-full flex-col items-center gap-4 rounded-2xl border border-border bg-surface p-6 text-center shadow-card">
      <div
        className="flex h-24 w-24 items-center justify-center rounded-full border-4 border-primary bg-primary-bg text-[40px]"
        aria-hidden="true"
      >
        {species.emoji}
      </div>

      <div>
        <h2 className="text-style-headline-sm text-text-h">{t('postFocusChoices.title')}</h2>
        <p className="text-style-body-sm text-text-muted">{t('postFocusChoices.subtitle', { species: species.name })}</p>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-3">
        <Button onClick={startAnotherFocus}>{t('flexibleModeToggle.focus')}</Button>
        <Button variant="secondary" onClick={startBreak}>
          {t('flexibleModeToggle.break')}
        </Button>
      </div>

      <div className="flex w-full flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-bg-subtle p-4 text-left">
        <div>
          <p className="text-style-label-lg text-text-h">{t('postFocusChoices.extendTitle')}</p>
          <p className="text-style-body-sm text-text-muted">{t('postFocusChoices.extendSubtitle')}</p>
        </div>
        <div className="flex gap-2">
          {ADD_TIME_OPTIONS_MINUTES.map((minutes) => (
            <button key={minutes} type="button" className={PILL_BUTTON_CLASSES} onClick={() => addTime(minutes * 60)}>
              {t('addMinutesButton', { minutes })}
            </button>
          ))}
        </div>
      </div>
    </section>
  )
}
