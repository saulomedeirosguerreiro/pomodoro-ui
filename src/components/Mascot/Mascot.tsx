import { useEffect, useRef, useState } from 'react'
import { useSettings } from '../../context/SettingsContext'
import { useTimerContext } from '../../context/TimerContext'
import { MASCOT_LABELS, pickPhrase } from '../../lib/mascotPhrases'
import { resolveMascotState, type MascotState } from '../../lib/mascotState'
import { SpeechBubble } from '../common/SpeechBubble'
import { TomatoArt } from './TomatoArt'

/** Janela de exibição dos estados transitórios (US-38 RN-01/CA-002). */
const RESULT_WINDOW_MS = 5000

const CHARACTER_STATE_CLASSES: Record<MascotState, string> = {
  ocioso: 'animate-[mascotFloat_3.2s_ease-in-out_infinite]',
  focado: 'animate-[mascotFloat_3.2s_ease-in-out_infinite]',
  quase_la: 'animate-[mascotFloat_3.2s_ease-in-out_infinite]',
  descansando: 'animate-[mascotFloat_3.2s_ease-in-out_infinite]',
  acolhendo: 'animate-[mascotFloat_3.2s_ease-in-out_infinite]',
  pausado: 'opacity-75',
  comemorando: 'animate-[mascotBounce_0.6s_ease-in-out_infinite]',
}

export function Mascot() {
  const timer = useTimerContext()
  const { settings } = useSettings()

  const [resultState, setResultState] = useState<'comemorando' | 'acolhendo' | null>(null)
  const lastSessionKeyRef = useRef<string | null>(null)

  useEffect(() => {
    const session = timer.lastRegisteredSession
    if (!session) {
      return
    }

    const key = `${session.id}-${session.completedAt}`
    if (key === lastSessionKeyRef.current) {
      return
    }
    lastSessionKeyRef.current = key

    setResultState(session.status === 'concluido' ? 'comemorando' : 'acolhendo')
    const timeoutId = setTimeout(() => setResultState(null), RESULT_WINDOW_MS)
    return () => clearTimeout(timeoutId)
  }, [timer.lastRegisteredSession])

  const state = resolveMascotState({
    phase: timer.phase,
    type: timer.type,
    remainingSeconds: timer.remainingSeconds,
    resultState,
  })

  const [phrase, setPhrase] = useState<string | null>(null)
  const previousStateRef = useRef<MascotState | null>(null)

  useEffect(() => {
    if (previousStateRef.current === state) {
      return
    }
    previousStateRef.current = state
    setPhrase((previousPhrase) => pickPhrase(state, previousPhrase))
  }, [state])

  return (
    <div className="flex flex-col items-center gap-2">
      {settings.mascotSpeechEnabled && phrase && <SpeechBubble>{phrase}</SpeechBubble>}

      <div className={`relative inline-flex ${CHARACTER_STATE_CLASSES[state]}`}>
        <TomatoArt />
        {state === 'comemorando' && (
          <span className="pointer-events-none absolute -inset-3" aria-hidden="true">
            <span className="absolute left-0 animate-[particleRise_1.4s_ease-out_infinite] text-lg [animation-delay:0s]">
              ✨
            </span>
            <span className="absolute left-1/2 animate-[particleRise_1.4s_ease-out_infinite] text-lg [animation-delay:0.3s]">
              ✨
            </span>
            <span className="absolute right-0 animate-[particleRise_1.4s_ease-out_infinite] text-lg [animation-delay:0.6s]">
              ✨
            </span>
          </span>
        )}
      </div>

      <p className="text-style-label-sm text-text-muted" role="status">
        {MASCOT_LABELS[state]}
      </p>
    </div>
  )
}
