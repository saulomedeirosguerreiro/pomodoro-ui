import { api } from './apiClient'
import { loadLocalSessions } from './localSessionsStore'
import { loadLocalTasks } from './localTasksStore'
import type { TaskItemStatus, TaskPriority, SessionType, SessionStatus } from '../types/api'

/**
 * Tipos espelhando EXATAMENTE o contrato real do backend (não o strawman original do plano):
 * `Pomodoro.Application.Migration.Import.ImportGuestDataRequest`/`ImportGuestDataResponse` (C#).
 * Literais de `priority`/`status`/`type` batem com `TaskWireFormat`/`SessionWireFormat` do backend —
 * os mesmos já usados em `types/api.ts` (`TaskPriority`, `TaskItemStatus`, `SessionType`, `SessionStatus`).
 */
export interface GuestTaskImportItem {
  localId: string
  title: string
  description: string | null
  priority: TaskPriority
  estimatedPomodoros: number
  status: TaskItemStatus
  createdAt?: string
  /** Só presente quando `status === 'feito'` (D5) — data a usar na conquista "Primeira Colheita". */
  completedAt?: string
}

export interface GuestSessionImportItem {
  localId: string
  type: SessionType
  status: SessionStatus
  durationSeconds: number
  startedAt: string
  completedAt: string
  /** Referencia `GuestTaskImportItem.localId` no MESMO payload — nunca um id de banco. */
  taskLocalId?: string
}

export interface ImportGuestDataRequest {
  guestId: string
  tasks: GuestTaskImportItem[]
  sessions: GuestSessionImportItem[]
}

export interface ImportedAchievementSummary {
  code: string
  name: string
  unlockedAt: string
}

export interface ImportSkippedItem {
  itemType: 'task' | 'session'
  localId: string
  reason: string
}

export interface ImportGuestDataResponse {
  importId: number
  guestId: string
  importedAt: string
  tasksImported: number
  sessionsImported: number
  achievementsUnlocked: ImportedAchievementSummary[]
  skipped: ImportSkippedItem[]
}

export const migrationService = {
  importLocalData: (request: ImportGuestDataRequest) =>
    api.post<ImportGuestDataResponse>('/api/migration/import', request),
}

/**
 * Monta o payload de `POST /api/migration/import` a partir do storage local — usado por `RegisterPage`
 * (cadastro de conta nova, D9/US-84) e por `usePostLoginMigration` (login em conta existente, US-85).
 * Usa o próprio `id` local (numérico) como `localId`/`taskLocalId`, convertido para string.
 */
export function buildImportRequestFromLocalData(guestId: string): ImportGuestDataRequest {
  const tasks = loadLocalTasks()
  const sessions = loadLocalSessions()

  return {
    guestId,
    tasks: tasks.map((task) => ({
      localId: String(task.id),
      title: task.title,
      description: task.description,
      priority: task.priority,
      estimatedPomodoros: task.estimatedPomodoros,
      status: task.status,
      createdAt: task.createdAt,
      ...(task.status === 'feito' && task.completedAtLocal ? { completedAt: task.completedAtLocal } : {}),
    })),
    sessions: sessions.map((session) => ({
      localId: String(session.id),
      type: session.type,
      status: session.status,
      durationSeconds: session.durationSeconds,
      startedAt: session.startedAt,
      completedAt: session.completedAt,
      ...(session.taskId != null ? { taskLocalId: String(session.taskId) } : {}),
    })),
  }
}
