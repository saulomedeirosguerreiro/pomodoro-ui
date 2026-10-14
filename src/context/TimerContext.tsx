import { createContext, useContext, useMemo, type ReactNode } from 'react'
import { useTimer } from '../components/Timer/useTimer'
import { sessionDurationsSecondsFrom } from '../lib/timerLogic'
import type { PomodoroSession, ProgressSummary, TaskItem } from '../types/api'
import { useSessionRegistrationContext } from './SessionRegistrationContext'
import { useSettings } from './SettingsContext'
import type { AppEvent } from './useSessionRegistration'

export type { AppEvent }

interface TimerContextValue extends ReturnType<typeof useTimer> {
  /** Última sessão registrada com sucesso — usado por quem exibe o histórico para atualizar sem refetch. */
  lastRegisteredSession: PomodoroSession | null
  registrationError: string | null
  retryRegistration: () => void
  dismissRegistrationError: () => void
  canRetryRegistration: boolean
  progress: ProgressSummary | null
  focusedTask: TaskItem | null
  refreshFocusedTask: () => void
  events: AppEvent[]
  markEventsSeen: () => void
}

const TimerContext = createContext<TimerContextValue | undefined>(undefined)

export function TimerProvider({ children }: { children: ReactNode }) {
  const { settings } = useSettings()
  const sessionRegistration = useSessionRegistrationContext()

  const durations = useMemo(
    () => sessionDurationsSecondsFrom(settings.focusMinutes, settings.shortBreakMinutes, settings.longBreakMinutes),
    [settings.focusMinutes, settings.shortBreakMinutes, settings.longBreakMinutes],
  )

  const timer = useTimer({
    totalFociCompleted: sessionRegistration.totalFociCompleted,
    onSessionReady: sessionRegistration.registerSession,
    durations,
  })

  const value: TimerContextValue = {
    ...timer,
    lastRegisteredSession: sessionRegistration.lastRegisteredSession,
    registrationError: sessionRegistration.registrationError,
    retryRegistration: sessionRegistration.retryRegistration,
    dismissRegistrationError: sessionRegistration.dismissRegistrationError,
    canRetryRegistration: sessionRegistration.canRetryRegistration,
    progress: sessionRegistration.progress,
    focusedTask: sessionRegistration.focusedTask,
    refreshFocusedTask: sessionRegistration.refreshFocusedTask,
    events: sessionRegistration.events,
    markEventsSeen: sessionRegistration.markEventsSeen,
  }

  return <TimerContext.Provider value={value}>{children}</TimerContext.Provider>
}

export function useTimerContext(): TimerContextValue {
  const context = useContext(TimerContext)
  if (!context) {
    throw new Error('useTimerContext precisa ser usado dentro de um TimerProvider.')
  }
  return context
}
