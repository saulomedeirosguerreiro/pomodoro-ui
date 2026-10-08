import { describe, expect, it, vi } from 'vitest'
import { achievementsService } from './achievementsService'
import { pomodorosService } from './pomodorosService'
import { progressService } from './progressService'
import { remoteDataSource } from './remoteDataSource'
import { tasksService } from './tasksService'
import { usersService } from './usersService'

/**
 * Teste de "contrato de delegação", não de lógica: `remoteDataSource` é um adaptador fino, então aqui
 * só garantimos que cada método do `DataSource` chama o service certo, com os argumentos certos, e
 * devolve o resultado dele sem transformação.
 */
vi.mock('./achievementsService')
vi.mock('./pomodorosService')
vi.mock('./progressService')
vi.mock('./tasksService')
vi.mock('./usersService')

describe('remoteDataSource', () => {
  it('createSession delega para pomodorosService.create', async () => {
    const payload = { type: 'foco' as const, status: 'concluido' as const, durationSeconds: 1500, startedAt: 'a', completedAt: 'b' }
    const created = { id: 1 }
    vi.mocked(pomodorosService.create).mockResolvedValue(created as never)

    await expect(remoteDataSource.createSession(payload)).resolves.toBe(created)
    expect(pomodorosService.create).toHaveBeenCalledWith(payload)
  })

  it('listSessions delega para pomodorosService.list com limit/offset repassados', async () => {
    const page = { items: [], totalCount: 0, limit: 5, offset: 1 }
    vi.mocked(pomodorosService.list).mockResolvedValue(page as never)

    await expect(remoteDataSource.listSessions(5, 1)).resolves.toBe(page)
    expect(pomodorosService.list).toHaveBeenCalledWith(5, 1)
  })

  it('getTotalCompletedFocusCount delega para usersService.getMe().completedSessions', async () => {
    vi.mocked(usersService.getMe).mockResolvedValue({ id: 1, name: 'A', email: 'a@a.com', completedSessions: 42 })

    await expect(remoteDataSource.getTotalCompletedFocusCount()).resolves.toBe(42)
  })

  it('listTasks delega para tasksService.list com o status repassado', async () => {
    vi.mocked(tasksService.list).mockResolvedValue([] as never)

    await remoteDataSource.listTasks('em_curso')
    expect(tasksService.list).toHaveBeenCalledWith('em_curso')
  })

  it('createTask delega para tasksService.create', async () => {
    const payload = { title: 'A', description: null, priority: 'media' as const, estimatedPomodoros: 1 }
    const created = { id: 1 }
    vi.mocked(tasksService.create).mockResolvedValue(created as never)

    await expect(remoteDataSource.createTask(payload)).resolves.toBe(created)
    expect(tasksService.create).toHaveBeenCalledWith(payload)
  })

  it('updateTask delega para tasksService.update', async () => {
    const payload = { title: 'A', description: null, priority: 'media' as const, estimatedPomodoros: 1 }
    const updated = { id: 7 }
    vi.mocked(tasksService.update).mockResolvedValue(updated as never)

    await expect(remoteDataSource.updateTask(7, payload)).resolves.toBe(updated)
    expect(tasksService.update).toHaveBeenCalledWith(7, payload)
  })

  it('setTaskStatus delega para tasksService.setStatus', async () => {
    const updated = { id: 7, status: 'feito' }
    vi.mocked(tasksService.setStatus).mockResolvedValue(updated as never)

    await expect(remoteDataSource.setTaskStatus(7, 'feito')).resolves.toBe(updated)
    expect(tasksService.setStatus).toHaveBeenCalledWith(7, 'feito')
  })

  it('removeTask delega para tasksService.remove', async () => {
    vi.mocked(tasksService.remove).mockResolvedValue(undefined)

    await remoteDataSource.removeTask(7)
    expect(tasksService.remove).toHaveBeenCalledWith(7)
  })

  it('getProgress delega para progressService.getMyProgress', async () => {
    const progress = { level: 1 }
    vi.mocked(progressService.getMyProgress).mockResolvedValue(progress as never)

    await expect(remoteDataSource.getProgress()).resolves.toBe(progress)
  })

  it('listAchievements delega para achievementsService.list', async () => {
    const achievements = [{ code: 'primeira_semente' }]
    vi.mocked(achievementsService.list).mockResolvedValue(achievements as never)

    await expect(remoteDataSource.listAchievements()).resolves.toBe(achievements)
  })
})
