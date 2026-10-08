import { useEffect, useRef, useState } from 'react'
import { useSettings } from '../../context/SettingsContext'
import { useTimerContext } from '../../context/TimerContext'
import { MASCOT_LABELS, pickPhrase } from '../../lib/mascotPhrases'
import { resolveMascotState, type MascotState } from '../../lib/mascotState'
import { SpeechBubble } from '../common/SpeechBubble'
import { TomatoArt } from './TomatoArt'
import styles from './Mascot.module.css'

/** Janela de exibição dos estados transitórios (US-38 RN-01/CA-002). */
const RESULT_WINDOW_MS = 5000

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
    <div className={styles.wrapper}>
      {settings.mascotSpeechEnabled && phrase && <SpeechBubble>{phrase}</SpeechBubble>}

      <div className={`${styles.character} ${styles[state]}`}>
        <TomatoArt />
        {state === 'comemorando' && (
          <span className={styles.particles} aria-hidden="true">
            <span>✨</span>
            <span>✨</span>
            <span>✨</span>
          </span>
        )}
      </div>

      <p className={styles.status} role="status">
        {MASCOT_LABELS[state]}
      </p>
    </div>
  )
}
