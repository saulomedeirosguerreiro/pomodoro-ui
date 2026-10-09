export type Theme = 'light' | 'dark'

const STORAGE_KEY = 'pomogarden:theme'
const DEFAULT_THEME: Theme = 'light'

export function loadTheme(): Theme {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw === 'dark' || raw === 'light' ? raw : DEFAULT_THEME
  } catch {
    return DEFAULT_THEME
  }
}

export function saveTheme(theme: Theme): void {
  try {
    localStorage.setItem(STORAGE_KEY, theme)
  } catch {
    /* localStorage indisponível (ex.: modo privado) — a preferência só não persiste entre sessões */
  }
}
