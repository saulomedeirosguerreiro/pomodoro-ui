import { useFlexibleTimerContext } from '../../context/FlexibleTimerContext'
import { formatMMSS } from '../../lib/timerLogic'
import { Button } from '../common/Button'

const RADIUS = 115
const CIRCUMFERENCE = 2 * Math.PI * RADIUS

const BREAK_LABEL = {
  descanso_curto: 'Pausa curta',
  descanso_longo: 'Pausa longa',
} as const

/**
 * Tela de pausa rodando/pausada do modo flexível (Parte 5 do plano) — "banco de descanso" com a
 * paleta calma (`--color-calm`), sem o mascote (que continua espelhando só o timer clássico).
 */
export function FlexibleBreakView() {
  const { phase, breakType, totalSeconds, remainingSeconds, pause, resume, endCurrentBlockNow, backToFocusNow } =
    useFlexibleTimerContext()

  const fractionElapsed = totalSeconds > 0 ? Math.min(1, Math.max(0, 1 - remainingSeconds / totalSeconds)) : 0
  const dashOffset = CIRCUMFERENCE * fractionElapsed
  const isPaused = phase.kind === 'descanso_pausado'

  return (
    <section className="flex w-full flex-col items-center gap-4 rounded-2xl border border-border bg-calm-bg p-6 shadow-card">
      <p className="rounded-full bg-calm-bg px-3.5 py-1 text-style-label-md uppercase tracking-[0.04em] text-calm-dark">
        {breakType ? BREAK_LABEL[breakType] : 'Pausa'}
      </p>

      <div className="relative h-[min(320px,80vw)] w-[min(320px,80vw)]">
        <svg className="h-full w-full -rotate-90" viewBox="0 0 260 260" aria-hidden="true">
          <circle cx="130" cy="130" r={RADIUS} fill="none" stroke="var(--color-bg-subtle)" strokeWidth="14" />
          <circle
            cx="130"
            cy="130"
            r={RADIUS}
            fill="none"
            stroke="var(--color-calm)"
            strokeWidth="14"
            strokeLinecap="round"
            strokeDasharray={CIRCUMFERENCE}
            strokeDashoffset={dashOffset}
            className="transition-[stroke-dashoffset] duration-1000 ease-linear"
          />
        </svg>

        <div className="absolute inset-0 flex flex-col items-center justify-center gap-1">
          <span className="text-[56px]" aria-hidden="true">
            🪑
          </span>
          <span className="text-style-display-timer-mobile text-text-h">{formatMMSS(remainingSeconds)}</span>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-4">
        {isPaused ? <Button onClick={resume}>Continuar</Button> : <Button onClick={pause}>Pausar</Button>}

        <Button variant="ghost" onClick={backToFocusNow}>
          Voltar ao foco agora
        </Button>

        <Button variant="ghost" onClick={endCurrentBlockNow}>
          Encerrar agora
        </Button>
      </div>
    </section>
  )
}
