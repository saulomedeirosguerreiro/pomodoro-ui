import { api } from './apiClient'
import type { PagedResult, PomodoroSession, SessionStatus, SessionType } from '../types/api'

export interface CreateSessionPayload {
  type: SessionType
  status: SessionStatus
  durationSeconds: number
  startedAt: string
  completedAt: string
  taskId?: number
  /** Metadados de origem do modo "Time Blocking Flexível" — omitidos para o modo clássico. */
  mode?: 'flexivel'
  plannedDurationSeconds?: number
  addedSeconds?: number
}

export const pomodorosService = {
  create: (payload: CreateSessionPayload) => api.post<PomodoroSession>('/api/pomodoros', payload),

  list: (limit = 10, offset = 0) =>
    api.get<PagedResult<PomodoroSession>>(`/api/pomodoros?limit=${limit}&offset=${offset}`),
}
