import { useState } from 'react'
import { ClassicTimerView } from '../components/TimeBlocking/ClassicTimerView'
import { FlexibleTimerView } from '../components/TimeBlocking/FlexibleTimerView'
import { TimerModeToggle, type TimerMode } from '../components/TimeBlocking/TimerModeToggle'
import { useFlexibleTimerContext } from '../context/FlexibleTimerContext'
import { useTimerContext } from '../context/TimerContext'
import { trackEvent } from '../lib/analytics'

/** Estados do timer flexível sem nenhuma sessão em andamento (ver `useFlexibleTimer.ts`). */
const IDLE_FLEXIBLE_KINDS = ['selecionando_foco', 'encerrado']

/**
 * `TimerPage` (Parte 5 do plano) vira só o switch entre os dois modos — a tela clássica inteira foi
 * extraída, sem mudança de comportamento, para `ClassicTimerView`. Seleção de modo não persiste
 * entre reloads (paridade com o comportamento já existente do timer clássico, que também é só
 * estado em memória).
 *
 * Trava do seletor de modo: os dois hooks de timer (`useTimer` clássico e `useFlexibleTimer`) ficam
 * montados o tempo todo via `TimerScope`, rodando em paralelo independente de qual está visível —
 * sem essa trava, nada impediria dois timers contando ao mesmo tempo. O modo não escolhido trava
 * enquanto o modo ativo tem uma sessão em andamento, rodando OU pausada — só `Encerrar sessão`
 * libera a troca, nunca `Pausar` — por isso não existe mais um caminho de "trocar com confirmação"
 * aqui: enquanto travado, o clique no outro card nem chega a `handleModeChange`.
 */
export function TimerPage() {
  const [activeMode, setActiveMode] = useState<TimerMode>('classico')
  const timer = useTimerContext()
  const flexible = useFlexibleTimerContext()

  const isLocked =
    activeMode === 'classico' ? timer.phase !== 'parado' : !IDLE_FLEXIBLE_KINDS.includes(flexible.phase.kind)

  function handleModeChange(nextMode: TimerMode) {
    setActiveMode(nextMode)
    trackEvent('mode_switch', { mode: nextMode })
  }

  return (
    <div className="mx-auto flex w-full max-w-[640px] flex-col items-center gap-4">
      <TimerModeToggle value={activeMode} onChange={handleModeChange} isLocked={isLocked} />

      {activeMode === 'classico' ? <ClassicTimerView /> : <FlexibleTimerView />}
    </div>
  )
}
