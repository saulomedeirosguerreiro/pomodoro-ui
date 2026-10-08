import type { PomodoroSession } from '../types/api'

/**
 * Mesma divergência deliberada de envelope versionado documentada em `lib/guestProfile.ts` — dado
 * salvo aqui é uma coleção (histórico de sessões), não um objeto de preferências.
 */

export const LOCAL_SESSIONS_STORAGE_KEY = 'pomogarden:guest-sessions:v1'

interface StoredEnvelope<T> {
  version: 1
  data: T
}

export function loadLocalSessions(): PomodoroSession[] {
  try {
    const raw = localStorage.getItem(LOCAL_SESSIONS_STORAGE_KEY)
    if (!raw) {
      return []
    }

    const envelope = JSON.parse(raw) as StoredEnvelope<PomodoroSession[]>
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

export function saveLocalSessions(sessions: PomodoroSession[]): void {
  try {
    const envelope: StoredEnvelope<PomodoroSession[]> = { version: 1, data: sessions }
    localStorage.setItem(LOCAL_SESSIONS_STORAGE_KEY, JSON.stringify(envelope))
  } catch {
    /* localStorage indisponível (ex.: modo privado) — o histórico só não persiste entre sessões */
  }
}
