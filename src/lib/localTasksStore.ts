import type { TaskItem } from '../types/api'

/**
 * Divergência deliberada em relação a `lib/settings.ts`: aqui o dado salvo é uma COLEÇÃO, não um
 * objeto de preferências — `{...DEFAULT, ...parsed}` não faz sentido para um array. Por isso o envelope
 * versionado `{ version: 1; data: T }`, com `switch (envelope.version)` como gancho de migração futura
 * (hoje só o caso 1). Ver `lib/guestProfile.ts` para a mesma nota, não repetida em cada arquivo.
 */

export const LOCAL_TASKS_STORAGE_KEY = 'pomogarden:guest-tasks:v1'

/**
 * `completedPomodoros` NUNCA é persistido aqui — é derivado em leitura por `localDataSource` (mesma
 * regra do backend: contagem de focos concluídos vinculados, não um contador salvo). `completedAtLocal`
 * é gravado quando a tarefa vira `feito` e alimenta o campo opcional `completedAt` do payload de
 * migração (`migrationService.importLocalData`, Frente 3), para a conquista "Primeira Colheita" ser
 * datada corretamente no servidor.
 */
export type StoredLocalTask = Omit<TaskItem, 'completedPomodoros'> & { completedAtLocal?: string }

interface StoredEnvelope<T> {
  version: 1
  data: T
}

export function loadLocalTasks(): StoredLocalTask[] {
  try {
    const raw = localStorage.getItem(LOCAL_TASKS_STORAGE_KEY)
    if (!raw) {
      return []
    }

    const envelope = JSON.parse(raw) as StoredEnvelope<StoredLocalTask[]>
    switch (envelope.version) {
      case 1:
        return envelope.data
      default:
        return []
    }
  } catch {
    return []
  }
}

export function saveLocalTasks(tasks: StoredLocalTask[]): void {
  try {
    const envelope: StoredEnvelope<StoredLocalTask[]> = { version: 1, data: tasks }
    localStorage.setItem(LOCAL_TASKS_STORAGE_KEY, JSON.stringify(envelope))
  } catch {
    /* localStorage indisponível (ex.: modo privado) — as tarefas só não persistem entre sessões */
  }
}
