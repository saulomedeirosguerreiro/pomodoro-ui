import { ApiError } from '../types/api'
import type { PomodoroSession, TaskItem } from '../types/api'
import { evaluateAchievements } from './achievementsEngine'
import { checkSessionIntegrity } from './antifraudGuard'
import type { DataSource } from './dataSource'
import { isDurationWithinFlexibleRange, isDurationWithinTolerance, validateTaskPayload } from './entityValidation'
import { loadUnlockedLedger, saveUnlockedLedger } from './localAchievementsStore'
import { loadLocalSessions, saveLocalSessions } from './localSessionsStore'
import { loadLocalTasks, saveLocalTasks, type StoredLocalTask } from './localTasksStore'
import type { CreateSessionPayload } from './pomodorosService'
import { computeLevelInfo, computeTotals, buildProgressSummary } from './progressEngine'
import { loadSettings } from './settings'
import type { TaskPayload } from './tasksService'
import { sessionDurationsSecondsFrom } from './timerLogic'

/**
 * Implementação de `DataSource` para o modo sem conta: opera só sobre `localStorage` (via os stores
 * da Frente 2) + o motor de regras puro da Frente 1 (`progressEngine`, `achievementsEngine`,
 * `antifraudGuard`, `entityValidation`). `_guestId` é recebido só para manter a porta aberta a
 * multi-perfil local no futuro (namespacing de chaves por guest); a primeira versão o ignora e opera
 * sobre as chaves fixas descritas nos stores — YAGNI, não há necessidade de over-engineer isso agora.
 */
export function makeLocalDataSource(_guestId: string): DataSource {
  return {
    async createSession(payload: CreateSessionPayload): Promise<PomodoroSession> {
      const existingSessions = loadLocalSessions()
      const now = new Date()

      const violation = checkSessionIntegrity(
        { startedAt: payload.startedAt, completedAt: payload.completedAt },
        existingSessions,
        now,
      )
      if (violation === 'future_timestamp') {
        throw new ApiError(422, {
          code: 'future_timestamp',
          message: 'O horário informado está no futuro além da tolerância permitida.',
        })
      }
      if (violation === 'overlap') {
        throw new ApiError(409, {
          code: 'overlap',
          message: 'Esta sessão se sobrepõe a outra sessão já registrada.',
        })
      }

      const settings = loadSettings()
      const configuredDurations = sessionDurationsSecondsFrom(
        settings.focusMinutes,
        settings.shortBreakMinutes,
        settings.longBreakMinutes,
      )
      const isDurationValid =
        payload.mode === 'flexivel'
          ? isDurationWithinFlexibleRange(payload.type, payload.durationSeconds)
          : isDurationWithinTolerance(payload.type, payload.durationSeconds, configuredDurations[payload.type])
      if (!isDurationValid) {
        throw new ApiError(422, {
          code: 'invalid_duration',
          message: 'A duração informada está fora da tolerância permitida para este tipo de sessão.',
        })
      }

      const session: PomodoroSession = {
        id: nextId(existingSessions.map((item) => item.id)),
        type: payload.type,
        status: payload.status,
        durationSeconds: payload.durationSeconds,
        startedAt: payload.startedAt,
        completedAt: payload.completedAt,
        createdAt: now.toISOString(),
        taskId: payload.taskId ?? null,
        mode: payload.mode ?? null,
        plannedDurationSeconds: payload.plannedDurationSeconds ?? null,
        addedSeconds: payload.addedSeconds ?? null,
      }

      saveLocalSessions([...existingSessions, session])
      return session
    },

    async listSessions(limit = 10, offset = 0) {
      const all = loadLocalSessions()
      // Mais recente primeiro, igual ao contrato de `GET /api/pomodoros` do backend real.
      const sorted = [...all].sort(
        (a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime(),
      )

      return {
        items: sorted.slice(offset, offset + limit),
        totalCount: sorted.length,
        limit,
        offset,
      }
    },

    async getTotalCompletedFocusCount() {
      return loadLocalSessions().filter((session) => session.type === 'foco' && session.status === 'concluido').length
    },

    async listTasks(status) {
      const sessions = loadLocalSessions()
      const items = loadLocalTasks().map((task) => toTaskItem(task, sessions))
      return status ? items.filter((task) => task.status === status) : items
    },

    async createTask(payload: TaskPayload) {
      const fields = validateTaskPayload(payload)
      if (fields.length > 0) {
        throw new ApiError(422, { code: 'validation_error', message: 'Dados da tarefa inválidos.', fields })
      }

      const tasks = loadLocalTasks()
      const now = new Date().toISOString()
      const task: StoredLocalTask = {
        id: nextId(tasks.map((item) => item.id)),
        title: payload.title,
        description: payload.description,
        priority: payload.priority,
        estimatedPomodoros: payload.estimatedPomodoros,
        status: 'a_fazer',
        createdAt: now,
        updatedAt: now,
      }

      saveLocalTasks([...tasks, task])
      return toTaskItem(task, loadLocalSessions())
    },

    async updateTask(id, payload: TaskPayload) {
      const fields = validateTaskPayload(payload)
      if (fields.length > 0) {
        throw new ApiError(422, { code: 'validation_error', message: 'Dados da tarefa inválidos.', fields })
      }

      const tasks = loadLocalTasks()
      const index = tasks.findIndex((task) => task.id === id)
      if (index === -1) {
        throw new ApiError(404, { code: 'not_found', message: 'Tarefa não encontrada.' })
      }

      const updated: StoredLocalTask = {
        ...tasks[index],
        title: payload.title,
        description: payload.description,
        priority: payload.priority,
        estimatedPomodoros: payload.estimatedPomodoros,
        updatedAt: new Date().toISOString(),
      }

      const next = [...tasks]
      next[index] = updated
      saveLocalTasks(next)
      return toTaskItem(updated, loadLocalSessions())
    },

    async setTaskStatus(id, status) {
      const tasks = loadLocalTasks()
      const index = tasks.findIndex((task) => task.id === id)
      if (index === -1) {
        throw new ApiError(404, { code: 'not_found', message: 'Tarefa não encontrada.' })
      }

      const now = new Date().toISOString()
      const next = tasks.map((task) => {
        if (task.id === id) {
          return {
            ...task,
            status,
            updatedAt: now,
            // Grava o instante em que virou `feito` — é o que `migrationService.importLocalData` envia
            // como `completedAt` da tarefa, para a conquista "Primeira Colheita" ser datada corretamente.
            ...(status === 'feito' ? { completedAtLocal: now } : {}),
          }
        }
        // Regra "no máximo 1 tarefa em_curso por vez": marcar UMA como em_curso desfoca as demais.
        if (status === 'em_curso' && task.status === 'em_curso') {
          return { ...task, status: 'a_fazer' as const, updatedAt: now }
        }
        return task
      })

      saveLocalTasks(next)
      return toTaskItem(next[index], loadLocalSessions())
    },

    async removeTask(id) {
      saveLocalTasks(loadLocalTasks().filter((task) => task.id !== id))
    },

    async getProgress() {
      const sessions = loadLocalSessions()
      return buildProgressSummary(sessions, resolveLocalTimeZone())
    },

    // ⚠️ Efeito colateral deliberado (documentado no plano, seção 2.3): além de calcular, grava no
    // ledger qualquer conquista recém-desbloqueada, para congelar `unlockedAt` nas próximas leituras.
    // Quebra a expectativa de "getter sem side effect" de propósito — é o único lugar que persiste.
    async listAchievements() {
      const sessions = loadLocalSessions()
      const tasks = loadLocalTasks().map((task) => toTaskItem(task, sessions))
      const level = computeLevelInfo(computeTotals(sessions).totalXp).level
      const ledger = loadUnlockedLedger()

      const achievements = evaluateAchievements({ sessions, tasks, level }, ledger)

      const nextLedger = new Map(ledger)
      let ledgerChanged = false
      for (const achievement of achievements) {
        if (achievement.unlockedAt && !ledger.has(achievement.code)) {
          nextLedger.set(achievement.code, achievement.unlockedAt)
          ledgerChanged = true
        }
      }
      if (ledgerChanged) {
        saveUnlockedLedger(nextLedger)
      }

      return achievements
    },
  }
}

/** Resolve o fuso IANA do navegador — mesmo fallback usado por `progressService.resolveTimeZone`. */
function resolveLocalTimeZone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone
  } catch {
    return 'America/Sao_Paulo'
  }
}

/** Não precisa ser globalmente único fora do dispositivo, só único dentro do array local. */
function nextId(ids: readonly number[]): number {
  return ids.length === 0 ? 1 : Math.max(...ids) + 1
}

/** Junta o item salvo com as sessões para computar `completedPomodoros` em leitura (nunca persistido). */
function toTaskItem(stored: StoredLocalTask, sessions: readonly PomodoroSession[]): TaskItem {
  const { completedAtLocal: _completedAtLocal, ...rest } = stored
  const completedPomodoros = sessions.filter(
    (session) => session.taskId === stored.id && session.type === 'foco' && session.status === 'concluido',
  ).length
  return { ...rest, completedPomodoros }
}
