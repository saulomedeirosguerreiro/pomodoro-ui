import { DEFAULT_SESSION_DURATIONS_SECONDS } from './timerLogic'

export interface Settings {
  notificationsEnabled: boolean
  mascotSpeechEnabled: boolean
  reduceAnimations: boolean
  sessionEndSoundEnabled: boolean
  lofiVolume: number
  focusMinutes: number
  shortBreakMinutes: number
  longBreakMinutes: number
  promoSecondsPerAd: number
  promoFocusPreview: boolean
}

export const DEFAULT_SETTINGS: Settings = {
  notificationsEnabled: false,
  mascotSpeechEnabled: true,
  reduceAnimations: false,
  // G-Q15/US-64 (resolvido): playSessionEndSound() agora sintetiza um som de verdade, então o aviso já vem ligado.
  sessionEndSoundEnabled: true,
  lofiVolume: 0.6,
  focusMinutes: DEFAULT_SESSION_DURATIONS_SECONDS.foco / 60,
  shortBreakMinutes: DEFAULT_SESSION_DURATIONS_SECONDS.descanso_curto / 60,
  longBreakMinutes: DEFAULT_SESSION_DURATIONS_SECONDS.descanso_longo / 60,
  promoSecondsPerAd: 8,
  promoFocusPreview: false,
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
