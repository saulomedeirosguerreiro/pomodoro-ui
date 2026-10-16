import type { TFunction } from 'i18next'
import type { MascotState } from './mascotState'

export function mascotLabel(t: TFunction, state: MascotState): string {
  return t(`mascot:labels.${state}`)
}

/** US-39 RN-01: catálogo estático, ≥ 3 falas por estado. Interrupção segue o tom empático (US-35). */
export function mascotPhrases(t: TFunction, state: MascotState): readonly string[] {
  return t(`mascot:phrases.${state}`, { returnObjects: true }) as readonly string[]
}

/** Rotaciona sem repetir a fala anterior (US-39 RN-01). */
export function pickPhrase(t: TFunction, state: MascotState, previousPhrase: string | null): string {
  const options = mascotPhrases(t, state)
  const candidates = options.length > 1 ? options.filter((phrase) => phrase !== previousPhrase) : options
  return candidates[Math.floor(Math.random() * candidates.length)]
}
