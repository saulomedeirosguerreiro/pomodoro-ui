import { createContext, useContext, type ReactNode } from 'react'
import { useFlexibleTimer } from '../components/TimeBlocking/useFlexibleTimer'
import type { Achievement, ProgressSummary } from '../types/api'
import { useSessionRegistrationContext } from './SessionRegistrationContext'

interface FlexibleTimerContextValue extends ReturnType<typeof useFlexibleTimer> {
  registrationError: string | null
  retryRegistration: () => void
  canRetryRegistration: boolean
  rewardToast: ReturnType<typeof useSessionRegistrationContext>['rewardToast']
  dismissRewardToast: () => void
  achievementToast: Achievement | null
  dismissAchievementToast: () => void
  progress: ProgressSummary | null
}

const FlexibleTimerContext = createContext<FlexibleTimerContextValue | undefined>(undefined)

/**
 * `FlexibleTimerProvider` (Parte 4 do plano): usa a MESMA instância de `useSessionRegistrationContext()`
 * consumida por `TimerProvider`, para que XP/sementes/conquistas/toasts sejam compartilhados entre os
 * dois modos, mais `useFlexibleTimer` para a máquina de estados própria do modo flexível (Parte 3).
 */
export function FlexibleTimerProvider({ children }: { children: ReactNode }) {
  const sessionRegistration = useSessionRegistrationContext()

  const flexibleTimer = useFlexibleTimer({
    onSessionReady: sessionRegistration.registerSession,
  })

  const value: FlexibleTimerContextValue = {
    ...flexibleTimer,
    registrationError: sessionRegistration.registrationError,
    retryRegistration: sessionRegistration.retryRegistration,
    canRetryRegistration: sessionRegistration.canRetryRegistration,
    rewardToast: sessionRegistration.rewardToast,
    dismissRewardToast: sessionRegistration.dismissRewardToast,
    achievementToast: sessionRegistration.achievementToast,
    dismissAchievementToast: sessionRegistration.dismissAchievementToast,
    progress: sessionRegistration.progress,
  }

  return <FlexibleTimerContext.Provider value={value}>{children}</FlexibleTimerContext.Provider>
}

export function useFlexibleTimerContext(): FlexibleTimerContextValue {
  const context = useContext(FlexibleTimerContext)
  if (!context) {
    throw new Error('useFlexibleTimerContext precisa ser usado dentro de um FlexibleTimerProvider.')
  }
  return context
}
