import { useCallback, useEffect, useMemo, useState } from 'react'
import { Button } from '../components/common/Button'
import { TodaysGardenCard } from '../components/Garden/TodaysGardenCard'
import { Mascot } from '../components/Mascot/Mascot'
import { ChecklistCard } from '../components/Tasks/ChecklistCard'
import { MissionCard } from '../components/Tasks/MissionCard'
import { ModeSwitcher } from '../components/Timer/ModeSwitcher'
import { TimerControls } from '../components/Timer/TimerControls'
import { TimerDisplay } from '../components/Timer/TimerDisplay'
import { useDataSource } from '../context/DataSourceContext'
import { useTimerContext } from '../context/TimerContext'
import type { TaskPayload } from '../lib/tasksService'
import { computeCycleCount } from '../lib/timerLogic'
import type { PomodoroSession, TaskItem } from '../types/api'

export function TimerPage() {
  const timer = useTimerContext()
  const { dataSource } = useDataSource()

  const [history, setHistory] = useState<PomodoroSession[] | null>(null)
  const [tasks, setTasks] = useState<TaskItem[] | null>(null)
  const [taskError, setTaskError] = useState<string | null>(null)

  const loadHistory = useCallback(async () => {
    if (!dataSource) return
    try {
      const page = await dataSource.listSessions(10, 0)
      setHistory(page.items)
    } catch {
      // "Ciclo N de 4" só fica impreciso até a próxima tentativa; não bloqueia o timer.
    }
  }, [dataSource])

  const loadTasks = useCallback(async () => {
    if (!dataSource) return
    try {
      const items = await dataSource.listTasks()
      setTaskError(null)
      setTasks(items)
    } catch {
      setTaskError('Não foi possível carregar as tarefas.')
    }
  }, [dataSource])

  useEffect(() => {
    loadHistory()
    loadTasks()
  }, [loadHistory, loadTasks])

  useEffect(() => {
    const session = timer.lastRegisteredSession
    if (!session) return

    setHistory((prev) => {
      if (!prev) return prev
      if (prev.some((s) => s.id === session.id)) return prev
      return [session, ...prev].slice(0, 10)
    })

    if (session.type === 'foco') {
      loadTasks()
    }
  }, [timer.lastRegisteredSession, loadTasks])

  const cycleCount = useMemo(() => computeCycleCount(history ?? []), [history])
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
    <div className="mx-auto flex w-full max-w-[640px] flex-col items-center gap-4">
      <Mascot />

      <ModeSwitcher type={timer.type} phase={timer.phase} onSelectType={timer.selectType} />

      <TimerDisplay type={timer.type} remainingSeconds={timer.remainingSeconds} cycleCount={cycleCount} />

      <TimerControls
        type={timer.type}
        phase={timer.phase}
        canFinalize={timer.canFinalize}
        onStart={timer.start}
        onPause={timer.pause}
        onResume={timer.resume}
        onRestart={timer.restart}
        onFinalize={timer.finalize}
        onSkip={timer.skip}
      />

      {timer.registrationError && (
        <div className="flex w-full flex-col items-center gap-2 rounded-lg bg-danger-bg p-4 text-center text-danger">
          <p>{timer.registrationError}</p>
          <Button variant="ghost" onClick={timer.retryRegistration}>
            Tentar novamente
          </Button>
        </div>
      )}

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
    </div>
  )
}
