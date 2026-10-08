import { beforeEach, describe, expect, it } from 'vitest'
import { ApiError } from '../types/api'
import { loadUnlockedLedger } from './localAchievementsStore'
import { makeLocalDataSource } from './localDataSource'
import { loadLocalTasks } from './localTasksStore'
import type { CreateSessionPayload } from './pomodorosService'
import type { TaskPayload } from './tasksService'

function sessionPayload(overrides: Partial<CreateSessionPayload> = {}): CreateSessionPayload {
  return {
    type: 'foco',
    status: 'concluido',
    durationSeconds: 1500,
    startedAt: '2020-01-01T10:00:00Z',
    completedAt: '2020-01-01T10:25:00Z',
    ...overrides,
  }
}

function taskPayload(overrides: Partial<TaskPayload> = {}): TaskPayload {
  return { title: 'Estudar', description: null, priority: 'media', estimatedPomodoros: 2, ...overrides }
}

describe('localDataSource', () => {
  const dataSource = makeLocalDataSource('guest-1')

  beforeEach(() => {
    localStorage.clear()
  })

  describe('createSession', () => {
    it('cria e persiste uma sessão válida, com id sequencial e taskId null por padrão', async () => {
      const created = await dataSource.createSession(sessionPayload())

      expect(created.id).toBe(1)
      expect(created.taskId).toBeNull()
      expect((await dataSource.listSessions()).items).toHaveLength(1)
    })

    it('rejeita com ApiError(future_timestamp) quando o horário está além da tolerância', async () => {
      await expect(
        dataSource.createSession(sessionPayload({ startedAt: '2999-01-01T10:00:00Z', completedAt: '2999-01-01T10:25:00Z' })),
      ).rejects.toMatchObject({ code: 'future_timestamp' })
    })

    it('rejeita com ApiError(overlap) quando a sessão se sobrepõe a outra já registrada', async () => {
      await dataSource.createSession(sessionPayload())

      await expect(
        dataSource.createSession(sessionPayload({ startedAt: '2020-01-01T10:10:00Z', completedAt: '2020-01-01T10:30:00Z' })),
      ).rejects.toMatchObject({ code: 'overlap' })
    })

    it('rejeita com ApiError(invalid_duration) quando a duração ultrapassa a tolerância do tipo', async () => {
      // Foco padrão = 1500s; tolerância = +60s (teto, sem simetria) => 1560s é o máximo aceito.
      await expect(
        dataSource.createSession(sessionPayload({ durationSeconds: 1600, completedAt: '2020-01-01T10:26:40Z' })),
      ).rejects.toMatchObject({ code: 'invalid_duration' })
    })

    it('o erro rejeitado é uma instância real de ApiError (mesmo formato usado pelo backend remoto)', async () => {
      await expect(
        dataSource.createSession(sessionPayload({ startedAt: '2999-01-01T10:00:00Z', completedAt: '2999-01-01T10:25:00Z' })),
      ).rejects.toBeInstanceOf(ApiError)
    })
  })

  describe('listSessions', () => {
    it('ordena da mais recente para a mais antiga e pagina com limit/offset', async () => {
      await dataSource.createSession(sessionPayload({ startedAt: '2020-01-01T10:00:00Z', completedAt: '2020-01-01T10:25:00Z' }))
      await dataSource.createSession(sessionPayload({ startedAt: '2020-01-02T10:00:00Z', completedAt: '2020-01-02T10:25:00Z' }))
      await dataSource.createSession(sessionPayload({ startedAt: '2020-01-03T10:00:00Z', completedAt: '2020-01-03T10:25:00Z' }))

      const firstPage = await dataSource.listSessions(2, 0)
      expect(firstPage.totalCount).toBe(3)
      expect(firstPage.items.map((s) => s.completedAt)).toEqual(['2020-01-03T10:25:00Z', '2020-01-02T10:25:00Z'])

      const secondPage = await dataSource.listSessions(2, 2)
      expect(secondPage.items.map((s) => s.completedAt)).toEqual(['2020-01-01T10:25:00Z'])
    })
  })

  describe('getTotalCompletedFocusCount', () => {
    it('conta só focos concluídos, ignorando pausas e focos interrompidos', async () => {
      await dataSource.createSession(sessionPayload())
      await dataSource.createSession(
        sessionPayload({ type: 'descanso_curto', durationSeconds: 300, startedAt: '2020-01-01T10:25:00Z', completedAt: '2020-01-01T10:30:00Z' }),
      )
      await dataSource.createSession(
        sessionPayload({ status: 'interrompido', durationSeconds: 300, startedAt: '2020-01-01T11:00:00Z', completedAt: '2020-01-01T11:05:00Z' }),
      )

      expect(await dataSource.getTotalCompletedFocusCount()).toBe(1)
    })
  })

  describe('tasks', () => {
    it('createTask valida o payload e rejeita com ApiError(validation_error)', async () => {
      await expect(dataSource.createTask(taskPayload({ title: '' }))).rejects.toMatchObject({ code: 'validation_error' })
    })

    it('createTask cria com completedPomodoros = 0 e status a_fazer', async () => {
      const task = await dataSource.createTask(taskPayload())
      expect(task.completedPomodoros).toBe(0)
      expect(task.status).toBe('a_fazer')
    })

    it('listTasks computa completedPomodoros em leitura, a partir das sessões vinculadas', async () => {
      const task = await dataSource.createTask(taskPayload())
      await dataSource.createSession(sessionPayload({ taskId: task.id }))
      await dataSource.createSession(sessionPayload({ taskId: task.id, startedAt: '2020-01-02T10:00:00Z', completedAt: '2020-01-02T10:25:00Z' }))

      const [listed] = await dataSource.listTasks()
      expect(listed.completedPomodoros).toBe(2)
    })

    it('listTasks filtra por status', async () => {
      await dataSource.createTask(taskPayload({ title: 'A' }))
      const taskB = await dataSource.createTask(taskPayload({ title: 'B' }))
      await dataSource.setTaskStatus(taskB.id, 'em_curso')

      const emCurso = await dataSource.listTasks('em_curso')
      expect(emCurso.map((t) => t.title)).toEqual(['B'])
    })

    it('updateTask atualiza os campos e rejeita id inexistente com ApiError(not_found)', async () => {
      const task = await dataSource.createTask(taskPayload())
      const updated = await dataSource.updateTask(task.id, taskPayload({ title: 'Novo título' }))
      expect(updated.title).toBe('Novo título')

      await expect(dataSource.updateTask(999, taskPayload())).rejects.toMatchObject({ code: 'not_found' })
    })

    it('setTaskStatus(em_curso) desfoca qualquer outra tarefa que estivesse em_curso', async () => {
      const taskA = await dataSource.createTask(taskPayload({ title: 'A' }))
      const taskB = await dataSource.createTask(taskPayload({ title: 'B' }))
      await dataSource.setTaskStatus(taskA.id, 'em_curso')

      await dataSource.setTaskStatus(taskB.id, 'em_curso')

      const tasks = await dataSource.listTasks()
      expect(tasks.find((t) => t.id === taskA.id)?.status).toBe('a_fazer')
      expect(tasks.find((t) => t.id === taskB.id)?.status).toBe('em_curso')
    })

    it('setTaskStatus(feito) grava completedAtLocal internamente, para o payload de migração', async () => {
      const task = await dataSource.createTask(taskPayload())
      await dataSource.setTaskStatus(task.id, 'feito')

      const stored = loadLocalTasks().find((t) => t.id === task.id)
      expect(stored?.completedAtLocal).toEqual(expect.any(String))
    })

    it('setTaskStatus rejeita id inexistente com ApiError(not_found)', async () => {
      await expect(dataSource.setTaskStatus(999, 'feito')).rejects.toMatchObject({ code: 'not_found' })
    })

    it('removeTask remove a tarefa da listagem', async () => {
      const task = await dataSource.createTask(taskPayload())
      await dataSource.removeTask(task.id)
      expect(await dataSource.listTasks()).toHaveLength(0)
    })
  })

  describe('getProgress', () => {
    it('reflete XP/sementes/nível calculados pelo progressEngine a partir das sessões persistidas', async () => {
      await dataSource.createSession(sessionPayload())

      const progress = await dataSource.getProgress()
      expect(progress.totalXp).toBe(25)
      expect(progress.seeds).toBe(15)
      expect(progress.level).toBe(1)
    })
  })

  describe('listAchievements', () => {
    it('desbloqueia e persiste no ledger quando o critério é atingido', async () => {
      await dataSource.createSession(sessionPayload())

      const achievements = await dataSource.listAchievements()
      const primeiraSemente = achievements.find((a) => a.code === 'primeira_semente')
      expect(primeiraSemente?.unlockedAt).not.toBeNull()

      const ledger = loadUnlockedLedger()
      expect(ledger.get('primeira_semente')).toBe(primeiraSemente?.unlockedAt)
    })

    it('congela unlockedAt em leituras subsequentes (não recalcula a data a cada chamada)', async () => {
      await dataSource.createSession(sessionPayload())

      const firstUnlockedAt = (await dataSource.listAchievements()).find((a) => a.code === 'primeira_semente')?.unlockedAt
      const secondUnlockedAt = (await dataSource.listAchievements()).find((a) => a.code === 'primeira_semente')?.unlockedAt

      expect(secondUnlockedAt).toBe(firstUnlockedAt)
    })
  })
})
