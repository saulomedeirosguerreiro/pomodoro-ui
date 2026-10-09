import { useState } from 'react'
import { ClassicTimerView } from '../components/TimeBlocking/ClassicTimerView'
import { FlexibleTimerView } from '../components/TimeBlocking/FlexibleTimerView'
import { TimerModeToggle, type TimerMode } from '../components/TimeBlocking/TimerModeToggle'
import { useFlexibleTimerContext } from '../context/FlexibleTimerContext'
import { useTimerContext } from '../context/TimerContext'

const RUNNING_FLEXIBLE_KINDS = ['foco_rodando', 'descanso_rodando']
const PAUSED_FLEXIBLE_KINDS = ['foco_pausado', 'descanso_pausado']

/**
 * `TimerPage` (Parte 5 do plano) vira só o switch entre os dois modos — a tela clássica inteira foi
 * extraída, sem mudança de comportamento, para `ClassicTimerView`. Seleção de modo não persiste
 * entre reloads (paridade com o comportamento já existente do timer clássico, que também é só
 * estado em memória).
 *
 * Trava do seletor de modo ("Seletor de Modo – Proposta A"): os dois hooks de timer (`useTimer`
 * clássico e `useFlexibleTimer`) ficam montados o tempo todo via `TimerScope`, rodando em paralelo
 * independente de qual está visível — sem essa trava, nada impediria dois timers contando ao mesmo
 * tempo. Por isso `TimerPage` lê o estado dos dois contextos só para decidir se o modo ATUALMENTE
 * ativo está rodando/pausado, e encerra a sessão corrente antes de trocar quando confirmado.
 */
export function TimerPage() {
  const [activeMode, setActiveMode] = useState<TimerMode>('classico')
  const timer = useTimerContext()
  const flexible = useFlexibleTimerContext()

  const isClassicRunning = timer.phase === 'rodando'
  const isClassicPaused = timer.phase === 'pausado'
  const isFlexibleRunning = RUNNING_FLEXIBLE_KINDS.includes(flexible.phase.kind)
  const isFlexiblePaused = PAUSED_FLEXIBLE_KINDS.includes(flexible.phase.kind)

  const isLocked = activeMode === 'classico' ? isClassicRunning : isFlexibleRunning
  const requiresConfirmation = activeMode === 'classico' ? isClassicPaused : isFlexiblePaused

  function handleConfirmedModeChange(nextMode: TimerMode) {
    if (activeMode === 'classico') {
      timer.finalize()
    } else {
      flexible.endCurrentBlockNow()
    }
    setActiveMode(nextMode)
  }

  return (
    <div className="mx-auto flex w-full max-w-[640px] flex-col items-center gap-4">
      <TimerModeToggle
        value={activeMode}
        onChange={setActiveMode}
        isLocked={isLocked}
        requiresConfirmation={requiresConfirmation}
        onConfirmedChange={handleConfirmedModeChange}
      />

      {activeMode === 'classico' ? <ClassicTimerView /> : <FlexibleTimerView />}
    </div>
  )
}
