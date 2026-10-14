import { useFlexibleTimerContext } from '../../context/FlexibleTimerContext'
import { Button } from '../common/Button'

/**
 * Decisão pós-pausa: dois botões lado a lado (não um toggle/segmented control) — "Foco" volta com
 * nova duração (`backToFocus`), "Pausa" abre mais uma pausa (`startBreak`, mesma função do fluxo
 * pós-foco, já aceita essa fase). Aqui não existe "modo atual" pra destacar como ativo, por isso os
 * dois lados têm o mesmo peso visual, igual ao fluxo pós-foco. "Finalizar tempo" saiu daqui e mora
 * na tela de escolher duração (`FlexibleDurationPicker`).
 */
export function FlexiblePostBreakChoices() {
  const { backToFocus, startBreak } = useFlexibleTimerContext()

  return (
    <section className="flex w-full flex-col items-center gap-4 rounded-2xl border border-border bg-surface p-6 text-center shadow-card">
      <h2 className="text-style-headline-sm text-text-h">Pausa concluída! Pronto para voltar?</h2>

      <div className="flex flex-wrap items-center justify-center gap-3">
        <Button onClick={backToFocus}>🌱 Foco</Button>
        <Button variant="secondary" onClick={startBreak}>
          ☕ Pausa
        </Button>
      </div>
    </section>
  )
}
