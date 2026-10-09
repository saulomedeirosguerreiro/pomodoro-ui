import { useFlexibleTimerContext } from '../../context/FlexibleTimerContext'
import { speciesForIndex } from '../../lib/gardenSpecies'

const ADD_TIME_OPTIONS_MINUTES = [5, 10] as const

const CARD_BASE_CLASSES =
  'flex flex-1 min-w-[140px] cursor-pointer flex-col items-start gap-2 rounded-2xl p-4 text-left transition-transform duration-150 ease-out hover:-translate-y-0.5 active:translate-y-0'

const ICON_CIRCLE_CLASSES = 'flex h-9 w-9 items-center justify-center rounded-full text-[18px]'

const PILL_BUTTON_CLASSES =
  'cursor-pointer rounded-full bg-secondary-bg px-4 py-2 text-style-label-md text-secondary-dark transition-colors duration-150 ease-out hover:bg-secondary hover:text-on-secondary'

/**
 * As 4 opções explícitas após um bloco de foco concluir (Parte 5 do plano, redesenhada a pedido do
 * usuário) — sem avanço automático. Cada ação dispara só a transição correspondente na máquina de
 * estados; a tela seguinte é decidida por `FlexibleTimerView` a partir do `phase.kind` resultante.
 * A espécie exibida é a que acabou de "nascer": `focusBlocksCompleted` já foi incrementado no
 * momento da conclusão natural (`useFlexibleTimer`), então o índice do bloco recém-concluído é
 * `focusBlocksCompleted - 1`.
 */
export function FlexiblePostFocusChoices() {
  const { startBreak, startAnotherFocus, addTime, endSession, focusBlocksCompleted } = useFlexibleTimerContext()
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
        <h2 className="text-style-headline-sm text-text-h">Foco concluído!</h2>
        <p className="text-style-body-sm text-text-muted">
          Seu {species.name} nasceu. O que vem agora?
        </p>
      </div>

      <div className="flex w-full flex-wrap gap-3">
        <button
          type="button"
          aria-label="Fazer uma pausa"
          className={`${CARD_BASE_CLASSES} bg-primary text-on-primary shadow-bevel-primary`}
          onClick={startBreak}
        >
          <span className={`${ICON_CIRCLE_CLASSES} bg-black/10`} aria-hidden="true">
            ☕
          </span>
          <span className="text-style-label-lg">Fazer uma pausa</span>
          <span className="text-style-body-sm opacity-90">Descansa antes do próximo</span>
        </button>

        <button
          type="button"
          aria-label="Começar outro foco"
          className={`${CARD_BASE_CLASSES} border-2 border-border bg-bg-subtle text-text-h`}
          onClick={startAnotherFocus}
        >
          <span className={`${ICON_CIRCLE_CLASSES} bg-secondary-bg text-secondary-dark`} aria-hidden="true">
            🌱
          </span>
          <span className="text-style-label-lg">Começar outro foco</span>
          <span className="text-style-body-sm text-text-muted">Plantar mais um</span>
        </button>
      </div>

      <div className="flex w-full flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-bg-subtle p-4 text-left">
        <div>
          <p className="text-style-label-lg text-text-h">Ainda no ritmo?</p>
          <p className="text-style-body-sm text-text-muted">Estenda este mesmo foco</p>
        </div>
        <div className="flex gap-2">
          {ADD_TIME_OPTIONS_MINUTES.map((minutes) => (
            <button key={minutes} type="button" className={PILL_BUTTON_CLASSES} onClick={() => addTime(minutes * 60)}>
              +{minutes} min
            </button>
          ))}
        </div>
      </div>

      <button
        type="button"
        className="cursor-pointer text-style-label-md text-text-muted transition-colors hover:text-text-h"
        onClick={endSession}
      >
        <span aria-hidden="true">✕ </span>
        Encerrar sessão
      </button>
    </section>
  )
}
