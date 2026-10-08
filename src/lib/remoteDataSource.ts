import { achievementsService } from './achievementsService'
import type { DataSource } from './dataSource'
import { pomodorosService } from './pomodorosService'
import { progressService } from './progressService'
import { tasksService } from './tasksService'
import { usersService } from './usersService'

/**
 * Adaptador fino para quem tem conta: delega 1:1 para os services HTTP já existentes
 * (`tasksService`, `pomodorosService`, `progressService`, `achievementsService`, `usersService`).
 * Zero mudança de comportamento — só uma camada de nomes para bater com a interface `DataSource`
 * consumida por `TimerContext`/páginas (Frente 4). Singleton: nenhum dos services guarda estado próprio.
 */
export const remoteDataSource: DataSource = {
  createSession: (payload) => pomodorosService.create(payload),
  listSessions: (limit, offset) => pomodorosService.list(limit, offset),
  getTotalCompletedFocusCount: async () => (await usersService.getMe()).completedSessions,

  listTasks: (status) => tasksService.list(status),
  createTask: (payload) => tasksService.create(payload),
  updateTask: (id, payload) => tasksService.update(id, payload),
  setTaskStatus: (id, status) => tasksService.setStatus(id, status),
  removeTask: (id) => tasksService.remove(id),

  getProgress: () => progressService.getMyProgress(),
  listAchievements: () => achievementsService.list(),
}
