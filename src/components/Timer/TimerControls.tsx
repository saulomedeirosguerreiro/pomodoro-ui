import { Button } from '../common/Button'
import type { SessionType } from '../../types/api'
import type { TimerPhase } from './useTimer'

const ICON_BUTTON_CLASSES =
  'flex h-14 w-14 cursor-pointer items-center justify-center rounded-full border-2 border-border bg-surface text-[22px] text-text-muted transition-[background-color,transform] duration-150 ease-out hover:bg-bg-subtle active:scale-95'

interface TimerControlsProps {
  type: SessionType
  phase: TimerPhase
  canFinalize: boolean
  onStart: () => void
  onPause: () => void
  onResume: () => void
  onRestart: () => void
  onFinalize: () => void
  onSkip: () => void
}

const START_LABEL: Record<SessionType, string> = {
  foco: 'Começar Foco',
  descanso_curto: 'Começar Pausa',
  descanso_longo: 'Começar Pausa',
}

export function TimerControls({
  type,
  phase,
  canFinalize,
  onStart,
  onPause,
  onResume,
  onRestart,
  onFinalize,
  onSkip,
}: TimerControlsProps) {
  function handleFinalize() {
    const confirmed = window.confirm(
      'Encerrar esta sessão agora? Tudo bem fazer uma pausa — o tempo focado até aqui já vai para o seu histórico.',
    )
    if (confirmed) {
      onFinalize()
    }
  }

  function handleSkip() {
    if (phase !== 'parado') {
      const confirmed = window.confirm('Pular este período? O tempo decorrido será registrado como interrompido.')
      if (!confirmed) return
    }
    onSkip()
  }

  return (
    <div className="flex flex-wrap items-center justify-center gap-4 pb-6">
      <button
        type="button"
        className={ICON_BUTTON_CLASSES}
        onClick={onRestart}
        title="Reiniciar sessão"
        aria-label="Reiniciar sessão"
      >
        ↺
      </button>

      {phase === 'rodando' ? (
        <Button onClick={onPause}>Pausar</Button>
      ) : phase === 'pausado' ? (
        <Button onClick={onResume}>Continuar</Button>
      ) : (
        <Button onClick={onStart}>{START_LABEL[type]}</Button>
      )}

      <button
        type="button"
        className={ICON_BUTTON_CLASSES}
        onClick={handleSkip}
        title="Pular período"
        aria-label="Pular período"
      >
        ⏭
      </button>

      <Button variant="ghost" onClick={handleFinalize} disabled={!canFinalize}>
        Encerrar sessão
      </Button>
    </div>
  )
}
