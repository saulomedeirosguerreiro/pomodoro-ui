import { clearGuestProfile, GUEST_PROFILE_STORAGE_KEY } from './guestProfile'
import { LOCAL_ACHIEVEMENTS_STORAGE_KEY } from './localAchievementsStore'
import { loadLocalSessions, LOCAL_SESSIONS_STORAGE_KEY } from './localSessionsStore'
import { loadLocalTasks, LOCAL_TASKS_STORAGE_KEY } from './localTasksStore'

/** As 4 chaves de `localStorage` usadas pelo modo guest — fonte única para `wipeAllLocalGuestData`. */
const ALL_GUEST_STORAGE_KEYS = [
  GUEST_PROFILE_STORAGE_KEY,
  LOCAL_TASKS_STORAGE_KEY,
  LOCAL_SESSIONS_STORAGE_KEY,
  LOCAL_ACHIEVEMENTS_STORAGE_KEY,
]

/** "Apagar meus dados deste dispositivo" (ConfiguracoesPage, modo guest). Limpa as 4 chaves acima. */
export function wipeAllLocalGuestData(): void {
  try {
    for (const key of ALL_GUEST_STORAGE_KEYS) {
      localStorage.removeItem(key)
    }
  } catch {
    /* localStorage indisponível — nada para limpar */
  }
  clearGuestProfile()
}

/**
 * Usado pelo fluxo de upgrade: existe algo a oferecer para importar? Checa CONTEÚDO (tarefas ou
 * sessões), não só a presença da chave do perfil — um guest recém-criado sem nenhuma sessão/tarefa
 * não deve disparar o diálogo de migração.
 */
export function hasAnyLocalGuestData(): boolean {
  return loadLocalTasks().length > 0 || loadLocalSessions().length > 0
}
