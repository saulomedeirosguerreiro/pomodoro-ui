import { useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '../common/Button'
import { TodaysGardenCard } from '../Garden/TodaysGardenCard'
import { Mascot } from '../Mascot/Mascot'
import { ChecklistCard } from '../Tasks/ChecklistCard'
import { MissionCard } from '../Tasks/MissionCard'
import { useDataSource } from '../../context/DataSourceContext'
import { useTimerContext } from '../../context/TimerContext'
import type { TaskPayload } from '../../lib/tasksService'
import type { TaskItem } from '../../types/api'
import { ModeSwitcher } from '../Timer/ModeSwitcher'
import { TimerControls } from '../Timer/TimerControls'
import { TimerDisplay } from '../Timer/TimerDisplay'

/**
 * Tela do Pomodoro Clássico — extração mecânica do corpo que antes vivia em `TimerPage.tsx`
 * (Parte 5 do plano): mesmas props via `useTimerContext()`/`useDataSource()`, zero lógica nova.
 * `TimerPage` agora só escolhe entre esta view e `FlexibleTimerView` a partir do `TimerModeToggle`.
 *
 * "Ciclo N de 4" vem direto de `timer.cycleCount` (contador global do `useTimer`) — não busca mais
 * histórico de sessões pra isso (era `computeCycleCount`, removido: divergia do contador real da
 * trava de sequência sempre que o histórico tinha mais de 10 itens desde a última pausa longa).
 */
export function ClassicTimerView() {
  const { t } = useTranslation('timer')
  const timer = useTimerContext()
  const { dataSource } = useDataSource()

  const [tasks, setTasks] = useState<TaskItem[] | null>(null)
  const [taskError, setTaskError] = useState<string | null>(null)

  const loadTasks = useCallback(async () => {
    if (!dataSource) return
    try {
      const items = await dataSource.listTasks()
      setTaskError(null)
      setTasks(items)
    } catch {
      setTaskError(t('taskLoadError'))
    }
  }, [dataSource, t])

  useEffect(() => {
    loadTasks()
  }, [loadTasks])

  useEffect(() => {
    const session = timer.lastRegisteredSession
    if (!session) return

    if (session.type === 'foco') {
      loadTasks()
    }
  }, [timer.lastRegisteredSession, loadTasks])

  const focusedTask = tasks?.find((t) => t.status === 'em_curso') ?? null

  async function handleCreateTask(payload: TaskPayload) {
    if (!dataSource) return
    await dataSource.createTask(payload)
    await loadTasks()
  }

  async function handleMarkTaskDone(task: TaskItem) {
    if (!dataSource) return
    await dataSource.setTaskStatus(task.id, 'feito')
    await loadTasks()
    if (task.status === 'em_curso') {
      timer.refreshFocusedTask()
    }
  }

  async function handleFocusTask(task: TaskItem) {
    if (!dataSource) return
    await dataSource.setTaskStatus(task.id, 'em_curso')
    await loadTasks()
    timer.refreshFocusedTask()
  }

  return (
    <>
      <section className="flex w-full flex-col items-center gap-4 rounded-2xl border border-border bg-surface p-6 shadow-card">
        <Mascot />

        <ModeSwitcher
          type={timer.type}
          phase={timer.phase}
          suggestedNextType={timer.suggestedNextType}
          onSelectType={timer.selectType}
        />

        <TimerDisplay
          type={timer.type}
          remainingSeconds={timer.remainingSeconds}
          totalSeconds={timer.totalSeconds}
          cycleCount={timer.cycleCount}
        />

        <TimerControls
          type={timer.type}
          phase={timer.phase}
          canFinalize={timer.canFinalize}
          onStart={timer.start}
          onPause={timer.pause}
          onResume={timer.resume}
          onRestart={timer.restart}
          onFinalize={timer.finalize}
        />

        {timer.registrationError && (
          <div className="relative flex w-full flex-col items-center gap-2 rounded-lg bg-danger-bg p-4 pr-10 text-center text-danger">
            <button
              type="button"
              onClick={timer.dismissRegistrationError}
              className="absolute right-2 top-2 flex h-6 w-6 cursor-pointer items-center justify-center rounded-full text-danger"
              aria-label={t('dismissWarning')}
            >
              ✕
            </button>
            <p>{timer.registrationError}</p>
            {timer.canRetryRegistration && (
              <Button variant="ghost" onClick={timer.retryRegistration}>
                {t('retryRegistration')}
              </Button>
            )}
          </div>
        )}
      </section>

      <MissionCard task={focusedTask} />

      <ChecklistCard
        tasks={tasks}
        error={taskError}
        onCreate={handleCreateTask}
        onMarkDone={handleMarkTaskDone}
        onFocus={handleFocusTask}
      />

      <TodaysGardenCard
        maturedCount={timer.progress?.todayFocusCount ?? 0}
        isGrowing={timer.type === 'foco' && timer.phase !== 'parado'}
      />
    </>
  )
}
