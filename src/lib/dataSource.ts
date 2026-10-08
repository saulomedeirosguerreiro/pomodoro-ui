import type { CreateSessionPayload } from './pomodorosService'
import type { TaskPayload } from './tasksService'
import type { Achievement, PagedResult, PomodoroSession, ProgressSummary, TaskItem, TaskItemStatus } from '../types/api'

/**
 * Contrato único de dados de domínio consumido por `TimerContext` e pelas páginas (Frente 4) —
 * implementado por `remoteDataSource` (delega para os services HTTP já existentes) e por
 * `localDataSource` (opera sobre `localStorage` + o motor de regras puro da Frente 1).
 *
 * Identidade (login/registro/exclusão de conta) fica de fora de propósito: é conceito de Frente 3,
 * não dado de domínio. Manter a interface pequena evita o anti-padrão "Context para tudo"/"God object".
 */
export interface DataSource {
  createSession(payload: CreateSessionPayload): Promise<PomodoroSession>
  listSessions(limit?: number, offset?: number): Promise<PagedResult<PomodoroSession>>
  /** Substitui o uso direto de `user.completedSessions` — funciona igual em modo conta e modo guest. */
  getTotalCompletedFocusCount(): Promise<number>

  listTasks(status?: TaskItemStatus): Promise<TaskItem[]>
  createTask(payload: TaskPayload): Promise<TaskItem>
  updateTask(id: number, payload: TaskPayload): Promise<TaskItem>
  setTaskStatus(id: number, status: TaskItemStatus): Promise<TaskItem>
  removeTask(id: number): Promise<void>

  getProgress(): Promise<ProgressSummary>
  listAchievements(): Promise<Achievement[]>
}
