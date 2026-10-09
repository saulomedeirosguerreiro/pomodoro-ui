import { useState } from 'react'
import { ClassicTimerView } from '../components/TimeBlocking/ClassicTimerView'
import { FlexibleTimerView } from '../components/TimeBlocking/FlexibleTimerView'
import { TimerModeToggle, type TimerMode } from '../components/TimeBlocking/TimerModeToggle'

/**
 * `TimerPage` (Parte 5 do plano) vira só o switch entre os dois modos — a tela clássica inteira foi
 * extraída, sem mudança de comportamento, para `ClassicTimerView`. Seleção de modo não persiste
 * entre reloads (paridade com o comportamento já existente do timer clássico, que também é só
 * estado em memória).
 */
export function TimerPage() {
  const [activeMode, setActiveMode] = useState<TimerMode>('classico')

  return (
    <div className="mx-auto flex w-full max-w-[640px] flex-col items-center gap-4">
      <TimerModeToggle value={activeMode} onChange={setActiveMode} />

      {activeMode === 'classico' ? <ClassicTimerView /> : <FlexibleTimerView />}
    </div>
  )
}
