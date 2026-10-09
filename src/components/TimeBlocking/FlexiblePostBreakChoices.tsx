import { useFlexibleTimerContext } from '../../context/FlexibleTimerContext'
import { Button } from '../common/Button'

/**
 * As 2 opções explícitas após uma pausa concluir (Parte 5 do plano): voltar ao foco com nova
 * duração, ou encerrar a sessão — sem "+tempo" nem "outra pausa" aqui (não foi pedido).
 */
export function FlexiblePostBreakChoices() {
  const { backToFocus, endSession } = useFlexibleTimerContext()

  return (
    <section className="flex w-full flex-col items-center gap-4 rounded-2xl border border-border bg-surface p-6 text-center shadow-card">
      <h2 className="text-style-headline-sm text-text-h">Pausa concluída! Pronto para voltar?</h2>

      <div className="flex flex-wrap items-center justify-center gap-3">
        <Button onClick={backToFocus}>Voltar ao foco</Button>
        <Button variant="ghost" onClick={endSession}>
          Encerrar sessão
        </Button>
      </div>
    </section>
  )
}
