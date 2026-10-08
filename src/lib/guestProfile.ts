/**
 * Divergência deliberada em relação a `lib/settings.ts`: `settings.ts` guarda um objeto plano de
 * preferências, então `{...DEFAULT, ...parsed}` já resolve migração de campo novo. Uma identidade
 * guest não é um objeto de preferências — não há "default" sensato para fazer merge. Por isso este
 * módulo (e os outros módulos novos da Frente 2 do modo sem conta) guarda um envelope versionado
 * `{ version: 1; data: T }`, com `switch (envelope.version)` como o gancho de migração futura — hoje
 * só existe o caso 1. Documentado aqui para quem ler depois não achar que é inconsistência acidental.
 */

export const GUEST_PROFILE_STORAGE_KEY = 'pomogarden:guest:v1'

export interface GuestProfile {
  id: string
  name: string
  createdAt: string
}

interface StoredEnvelope<T> {
  version: 1
  data: T
}

export function loadGuestProfile(): GuestProfile | null {
  try {
    const raw = localStorage.getItem(GUEST_PROFILE_STORAGE_KEY)
    if (!raw) {
      return null
    }

    const envelope = JSON.parse(raw) as StoredEnvelope<GuestProfile>
    switch (envelope.version) {
      case 1:
        return envelope.data
      default:
        return null
    }
  } catch {
    return null
  }
}

export function saveGuestProfile(profile: GuestProfile): void {
  try {
    const envelope: StoredEnvelope<GuestProfile> = { version: 1, data: profile }
    localStorage.setItem(GUEST_PROFILE_STORAGE_KEY, JSON.stringify(envelope))
  } catch {
    /* localStorage indisponível (ex.: modo privado) — a identidade guest só não persiste entre sessões */
  }
}

/** Só constrói o perfil (id via `crypto.randomUUID()`) — não persiste. Quem chama decide quando salvar. */
export function createGuestProfile(name: string): GuestProfile {
  return { id: crypto.randomUUID(), name, createdAt: new Date().toISOString() }
}

export function clearGuestProfile(): void {
  try {
    localStorage.removeItem(GUEST_PROFILE_STORAGE_KEY)
  } catch {
    /* localStorage indisponível — nada para limpar */
  }
}
