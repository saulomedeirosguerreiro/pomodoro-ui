import { api } from './apiClient'
import type { TaskItem, TaskItemStatus, TaskPriority } from '../types/api'

export interface TaskPayload {
  title: string
  description: string | null
  priority: TaskPriority
  estimatedPomodoros: number
}

export const tasksService = {
  list: (status?: TaskItemStatus) =>
    api.get<TaskItem[]>(`/api/tasks${status ? `?status=${status}` : ''}`),

  create: (payload: TaskPayload) => api.post<TaskItem>('/api/tasks', payload),

  update: (id: number, payload: TaskPayload) => api.patch<TaskItem>(`/api/tasks/${id}`, payload),

  setStatus: (id: number, status: TaskItemStatus) =>
    api.patch<TaskItem>(`/api/tasks/${id}/status`, { status }),

  remove: (id: number) => api.delete<void>(`/api/tasks/${id}`),
}
