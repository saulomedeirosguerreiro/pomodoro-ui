/**
 * Mesma divergência deliberada de envelope versionado documentada em `lib/guestProfile.ts`. O ledger
 * guarda só o que JÁ foi desbloqueado (code -> unlockedAt ISO) — o estado calculado (met/progresso)
 * é sempre ao vivo, via `achievementsEngine.evaluateAchievements`, nunca persistido. `Map` não é
 * JSON-serializável diretamente, então o envelope guarda a forma de array de tuplas `[code, unlockedAt]`.
 */

export const LOCAL_ACHIEVEMENTS_STORAGE_KEY = 'pomogarden:guest-achievements:v1'

type LedgerEntries = [string, string][]

interface StoredEnvelope<T> {
  version: 1
  data: T
}

export function loadUnlockedLedger(): Map<string, string> {
  try {
    const raw = localStorage.getItem(LOCAL_ACHIEVEMENTS_STORAGE_KEY)
    if (!raw) {
      return new Map()
    }

    const envelope = JSON.parse(raw) as StoredEnvelope<LedgerEntries>
    switch (envelope.version) {
      case 1:
        return new Map(envelope.data)
      default:
        return new Map()
    }
  } catch {
    return new Map()
  }
}

export function saveUnlockedLedger(ledger: ReadonlyMap<string, string>): void {
  try {
    const envelope: StoredEnvelope<LedgerEntries> = { version: 1, data: Array.from(ledger.entries()) }
    localStorage.setItem(LOCAL_ACHIEVEMENTS_STORAGE_KEY, JSON.stringify(envelope))
  } catch {
    /* localStorage indisponível (ex.: modo privado) — o ledger só não persiste entre sessões */
  }
}
