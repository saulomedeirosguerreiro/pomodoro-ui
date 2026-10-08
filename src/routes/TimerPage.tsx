import { useCallback, useEffect, useMemo, useState } from 'react'
import { Button } from '../components/common/Button'
import { TodaysGardenCard } from '../components/Garden/TodaysGardenCard'
import { Mascot } from '../components/Mascot/Mascot'
import { ChecklistCard } from '../components/Tasks/ChecklistCard'
import { MissionCard } from '../components/Tasks/MissionCard'
import { ModeSwitcher } from '../components/Timer/ModeSwitcher'
import { TimerControls } from '../components/Timer/TimerControls'
import { TimerDisplay } from '../components/Timer/TimerDisplay'
import { useTimerContext } from '../context/TimerContext'
import { pomodorosService } from '../lib/pomodorosService'
import { computeCycleCount } from '../lib/timerLogic'
import { tasksService, type TaskPayload } from '../lib/tasksService'
import type { PomodoroSession, TaskItem } from '../types/api'
import styles from './TimerPage.module.css'

export function TimerPage() {
  const timer = useTimerContext()

  const [history, setHistory] = useState<PomodoroSession[] | null>(null)
  const [tasks, setTasks] = useState<TaskItem[] | null>(null)
  const [taskError, setTaskError] = useState<string | null>(null)

  const loadHistory = useCallback(async () => {
    try {
      const page = await pomodorosService.list(10, 0)
      setHistory(page.items)
    } catch {
      // "Ciclo N de 4" só fica impreciso até a próxima tentativa; não bloqueia o timer.
    }
  }, [])

  const loadTasks = useCallback(async () => {
    try {
      const items = await tasksService.list()
      setTaskError(null)
      setTasks(items)
    } catch {
      setTaskError('Não foi possível carregar as tarefas.')
    }
  }, [])

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
    await tasksService.create(payload)
    await loadTasks()
  }

  async function handleMarkTaskDone(task: TaskItem) {
    await tasksService.setStatus(task.id, 'feito')
    await loadTasks()
    if (task.status === 'em_curso') {
      timer.refreshFocusedTask()
    }
  }

  async function handleFocusTask(task: TaskItem) {
    await tasksService.setStatus(task.id, 'em_curso')
    await loadTasks()
    timer.refreshFocusedTask()
  }

  return (
    <div className={styles.page}>
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
        <div className={styles.registrationError}>
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
