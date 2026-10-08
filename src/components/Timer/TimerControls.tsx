import { Button } from '../common/Button'
import type { SessionType } from '../../types/api'
import type { TimerPhase } from './useTimer'
import styles from './TimerControls.module.css'

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
    <div className={styles.controls}>
      <button
        type="button"
        className={styles.iconButton}
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
        className={styles.iconButton}
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
