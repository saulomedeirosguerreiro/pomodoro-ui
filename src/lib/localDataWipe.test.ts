import { afterEach, describe, expect, it } from 'vitest'
import { createGuestProfile, loadGuestProfile, saveGuestProfile } from './guestProfile'
import { hasAnyLocalGuestData, wipeAllLocalGuestData } from './localDataWipe'
import { loadUnlockedLedger, saveUnlockedLedger } from './localAchievementsStore'
import { loadLocalSessions, saveLocalSessions } from './localSessionsStore'
import { loadLocalTasks, saveLocalTasks } from './localTasksStore'

describe('localDataWipe', () => {
  afterEach(() => {
    localStorage.clear()
  })

  describe('hasAnyLocalGuestData', () => {
    it('sem tarefas e sem sessões, retorna false mesmo com perfil guest existente', () => {
      saveGuestProfile(createGuestProfile('Visitante'))

      expect(hasAnyLocalGuestData()).toBe(false)
    })

    it('com ao menos uma tarefa, retorna true', () => {
      saveLocalTasks([
        {
          id: 1,
          title: 'A',
          description: null,
          priority: 'media',
          status: 'a_fazer',
          estimatedPomodoros: 1,
          createdAt: '2026-01-01T00:00:00Z',
          updatedAt: '2026-01-01T00:00:00Z',
        },
      ])

      expect(hasAnyLocalGuestData()).toBe(true)
    })

    it('com ao menos uma sessão, retorna true', () => {
      saveLocalSessions([
        {
          id: 1,
          type: 'foco',
          status: 'concluido',
          durationSeconds: 1500,
          startedAt: '2026-01-01T10:00:00Z',
          completedAt: '2026-01-01T10:25:00Z',
          createdAt: '2026-01-01T10:25:00Z',
        },
      ])

      expect(hasAnyLocalGuestData()).toBe(true)
    })
  })

  describe('wipeAllLocalGuestData', () => {
    it('limpa perfil, tarefas, sessões e ledger de conquistas', () => {
      saveGuestProfile(createGuestProfile('Visitante'))
      saveLocalTasks([
        {
          id: 1,
          title: 'A',
          description: null,
          priority: 'media',
          status: 'a_fazer',
          estimatedPomodoros: 1,
          createdAt: '2026-01-01T00:00:00Z',
          updatedAt: '2026-01-01T00:00:00Z',
        },
      ])
      saveLocalSessions([
        {
          id: 1,
          type: 'foco',
          status: 'concluido',
          durationSeconds: 1500,
          startedAt: '2026-01-01T10:00:00Z',
          completedAt: '2026-01-01T10:25:00Z',
          createdAt: '2026-01-01T10:25:00Z',
        },
      ])
      saveUnlockedLedger(new Map([['primeira_semente', '2026-01-01T10:25:00Z']]))

      wipeAllLocalGuestData()

      expect(loadGuestProfile()).toBeNull()
      expect(loadLocalTasks()).toEqual([])
      expect(loadLocalSessions()).toEqual([])
      expect(loadUnlockedLedger().size).toBe(0)
    })
  })
})
