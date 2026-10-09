import { createContext, useContext, useMemo, type ReactNode } from 'react'
import { useTimer } from '../components/Timer/useTimer'
import { sessionDurationsSecondsFrom } from '../lib/timerLogic'
import type { Achievement, PomodoroSession, ProgressSummary, TaskItem } from '../types/api'
import { useSessionRegistrationContext } from './SessionRegistrationContext'
import { useSettings } from './SettingsContext'
import type { AppEvent, RewardToast } from './useSessionRegistration'

export type { AppEvent, RewardToast }

interface TimerContextValue extends ReturnType<typeof useTimer> {
  /** Última sessão registrada com sucesso — usado por quem exibe o histórico para atualizar sem refetch. */
  lastRegisteredSession: PomodoroSession | null
  registrationError: string | null
  retryRegistration: () => void
  canRetryRegistration: boolean
  progress: ProgressSummary | null
  rewardToast: RewardToast | null
  dismissRewardToast: () => void
  focusedTask: TaskItem | null
  refreshFocusedTask: () => void
  achievementToast: Achievement | null
  dismissAchievementToast: () => void
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
    canRetryRegistration: sessionRegistration.canRetryRegistration,
    progress: sessionRegistration.progress,
    rewardToast: sessionRegistration.rewardToast,
    dismissRewardToast: sessionRegistration.dismissRewardToast,
    focusedTask: sessionRegistration.focusedTask,
    refreshFocusedTask: sessionRegistration.refreshFocusedTask,
    achievementToast: sessionRegistration.achievementToast,
    dismissAchievementToast: sessionRegistration.dismissAchievementToast,
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
