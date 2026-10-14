import { ClassicTimerView } from '../components/TimeBlocking/ClassicTimerView'
import { FlexibleTimerView } from '../components/TimeBlocking/FlexibleTimerView'
import { TimerModeToggle, type TimerMode } from '../components/TimeBlocking/TimerModeToggle'
import { ACTIVE_BLOCK_KINDS } from '../components/TimeBlocking/useFlexibleTimer'
import { useFlexibleTimerContext } from '../context/FlexibleTimerContext'
import { useSettings } from '../context/SettingsContext'
import { useTimerContext } from '../context/TimerContext'
import { trackEvent } from '../lib/analytics'

/**
 * `TimerPage` (Parte 5 do plano) vira só o switch entre os dois modos — a tela clássica inteira foi
 * extraída, sem mudança de comportamento, para `ClassicTimerView`. Seleção de modo persiste via
 * `settings.lastTimerMode` (sobrevive a navegar pra outra página — `TimerPage` desmonta/remonta a
 * cada troca de rota — e a um reload), em vez de um `useState` local que se perdia nos dois casos.
 *
 * Trava do seletor de modo: os dois hooks de timer (`useTimer` clássico e `useFlexibleTimer`) ficam
 * montados o tempo todo via `TimerScope`, rodando em paralelo independente de qual está visível —
 * sem essa trava, nada impediria dois timers contando ao mesmo tempo. O modo não escolhido trava
 * enquanto o modo ativo tem uma sessão em andamento, rodando OU pausada — só `Encerrar sessão`
 * libera a troca, nunca `Pausar` — por isso não existe mais um caminho de "trocar com confirmação"
 * aqui: enquanto travado, o clique no outro card nem chega a `handleModeChange`.
 */
export function TimerPage() {
  const { settings, updateSettings } = useSettings()
  const activeMode = settings.lastTimerMode
  const timer = useTimerContext()
  const flexible = useFlexibleTimerContext()

  const isLocked =
    activeMode === 'classico' ? timer.phase !== 'parado' : ACTIVE_BLOCK_KINDS.includes(flexible.phase.kind)

  function handleModeChange(nextMode: TimerMode) {
    updateSettings({ lastTimerMode: nextMode })
    trackEvent('mode_switch', { mode: nextMode })
  }

  return (
    <div className="mx-auto flex w-full max-w-[640px] flex-col items-center gap-4">
      <TimerModeToggle value={activeMode} onChange={handleModeChange} isLocked={isLocked} />

      {activeMode === 'classico' ? <ClassicTimerView /> : <FlexibleTimerView />}
    </div>
  )
}
