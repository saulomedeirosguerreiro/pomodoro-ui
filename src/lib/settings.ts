export type AmbientTrackId = 'chuva' | 'cafeteria' | 'passaros'

export interface Settings {
  notificationsEnabled: boolean
  mascotSpeechEnabled: boolean
  reduceAnimations: boolean
  sessionEndSoundEnabled: boolean
  ambientTrack: AmbientTrackId | null
  ambientVolume: number
  lofiVolume: number
}

export const DEFAULT_SETTINGS: Settings = {
  notificationsEnabled: false,
  mascotSpeechEnabled: true,
  reduceAnimations: false,
  sessionEndSoundEnabled: false,
  ambientTrack: null,
  ambientVolume: 0.6,
  lofiVolume: 0.6,
}

const STORAGE_KEY = 'pomogarden:settings'

/** G-Q19: preferências só de cliente, sem reload para aplicar (US-61). */
export function loadSettings(): Settings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) {
      return DEFAULT_SETTINGS
    }
    return { ...DEFAULT_SETTINGS, ...(JSON.parse(raw) as Partial<Settings>) }
  } catch {
    return DEFAULT_SETTINGS
  }
}

export function saveSettings(settings: Settings): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings))
  } catch {
    /* localStorage indisponível (ex.: modo privado) — a preferência só não persiste entre sessões */
  }
}
