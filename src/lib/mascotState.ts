import type { TimerPhase } from '../components/Timer/useTimer'
import type { SessionType } from '../types/api'

export type MascotState = 'ocioso' | 'focado' | 'quase_la' | 'descansando' | 'pausado' | 'comemorando' | 'acolhendo'

const QUASE_LA_THRESHOLD_SECONDS = 60

export interface ResolveMascotStateInput {
  phase: TimerPhase
  type: SessionType
  remainingSeconds: number
  /** Resultado transitório (comemorando/acolhendo) de um registro recente, com janela própria de exibição. */
  resultState: 'comemorando' | 'acolhendo' | null
}

/** US-38 RN-01: estado do mascote, derivado do timer — puro, sem relógio de parede nem I/O. */
export function resolveMascotState({ phase, type, remainingSeconds, resultState }: ResolveMascotStateInput): MascotState {
  if (resultState) {
    return resultState
  }

  if (phase === 'pausado') {
    return 'pausado'
  }

  if (phase === 'rodando') {
    if (type !== 'foco') {
      return 'descansando'
    }
    return remainingSeconds < QUASE_LA_THRESHOLD_SECONDS ? 'quase_la' : 'focado'
  }

  return 'ocioso'
}
