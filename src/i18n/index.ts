import i18next from 'i18next'
import LanguageDetector from 'i18next-browser-languagedetector'
import { initReactI18next } from 'react-i18next'
import achievementsEnUS from './locales/en-US/achievements.json'
import authEnUS from './locales/en-US/auth.json'
import commonEnUS from './locales/en-US/common.json'
import frasesDoDiaEnUS from './locales/en-US/frasesDoDia.json'
import gardenEnUS from './locales/en-US/garden.json'
import historyEnUS from './locales/en-US/history.json'
import legalEnUS from './locales/en-US/legal.json'
import mascotEnUS from './locales/en-US/mascot.json'
import promosEnUS from './locales/en-US/promos.json'
import settingsEnUS from './locales/en-US/settings.json'
import soundEnUS from './locales/en-US/sound.json'
import tasksEnUS from './locales/en-US/tasks.json'
import timerEnUS from './locales/en-US/timer.json'
import achievementsEs from './locales/es/achievements.json'
import authEs from './locales/es/auth.json'
import commonEs from './locales/es/common.json'
import frasesDoDiaEs from './locales/es/frasesDoDia.json'
import gardenEs from './locales/es/garden.json'
import historyEs from './locales/es/history.json'
import legalEs from './locales/es/legal.json'
import mascotEs from './locales/es/mascot.json'
import promosEs from './locales/es/promos.json'
import settingsEs from './locales/es/settings.json'
import soundEs from './locales/es/sound.json'
import tasksEs from './locales/es/tasks.json'
import timerEs from './locales/es/timer.json'
import achievementsPtBR from './locales/pt-BR/achievements.json'
import authPtBR from './locales/pt-BR/auth.json'
import commonPtBR from './locales/pt-BR/common.json'
import frasesDoDiaPtBR from './locales/pt-BR/frasesDoDia.json'
import gardenPtBR from './locales/pt-BR/garden.json'
import historyPtBR from './locales/pt-BR/history.json'
import legalPtBR from './locales/pt-BR/legal.json'
import mascotPtBR from './locales/pt-BR/mascot.json'
import promosPtBR from './locales/pt-BR/promos.json'
import settingsPtBR from './locales/pt-BR/settings.json'
import soundPtBR from './locales/pt-BR/sound.json'
import tasksPtBR from './locales/pt-BR/tasks.json'
import timerPtBR from './locales/pt-BR/timer.json'

export const SUPPORTED_LANGUAGES = ['pt-BR', 'en-US', 'es'] as const
export type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number]
export const DEFAULT_LANGUAGE: SupportedLanguage = 'pt-BR'

export const LANGUAGE_STORAGE_KEY = 'pomogarden:language'

export const NAMESPACES = [
  'common',
  'timer',
  'tasks',
  'garden',
  'achievements',
  'history',
  'settings',
  'auth',
  'legal',
  'mascot',
  'frasesDoDia',
  'promos',
  'sound',
] as const

const resources = {
  'pt-BR': {
    common: commonPtBR,
    timer: timerPtBR,
    tasks: tasksPtBR,
    garden: gardenPtBR,
    achievements: achievementsPtBR,
    history: historyPtBR,
    settings: settingsPtBR,
    auth: authPtBR,
    legal: legalPtBR,
    mascot: mascotPtBR,
    frasesDoDia: frasesDoDiaPtBR,
    promos: promosPtBR,
    sound: soundPtBR,
  },
  'en-US': {
    common: commonEnUS,
    timer: timerEnUS,
    tasks: tasksEnUS,
    garden: gardenEnUS,
    achievements: achievementsEnUS,
    history: historyEnUS,
    settings: settingsEnUS,
    auth: authEnUS,
    legal: legalEnUS,
    mascot: mascotEnUS,
    frasesDoDia: frasesDoDiaEnUS,
    promos: promosEnUS,
    sound: soundEnUS,
  },
  es: {
    common: commonEs,
    timer: timerEs,
    tasks: tasksEs,
    garden: gardenEs,
    achievements: achievementsEs,
    history: historyEs,
    settings: settingsEs,
    auth: authEs,
    legal: legalEs,
    mascot: mascotEs,
    frasesDoDia: frasesDoDiaEs,
    promos: promosEs,
    sound: soundEs,
  },
}

/** Normaliza o idioma relatado pelo navegador (`en-GB`, `es-MX`, `pt-PT`...) para um dos 3 idiomas
 *  que o app de fato suporta — sem isso, o detector tentaria `fallbackLng` direto em vez de cair
 *  numa variante razoável do mesmo idioma. */
export function convertDetectedLanguage(lng: string): string {
  const lower = lng.toLowerCase()
  if (lower.startsWith('en')) return 'en-US'
  if (lower.startsWith('es')) return 'es'
  if (lower.startsWith('pt')) return 'pt-BR'
  return DEFAULT_LANGUAGE
}

i18next
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    supportedLngs: SUPPORTED_LANGUAGES,
    fallbackLng: DEFAULT_LANGUAGE,
    defaultNS: 'common',
    ns: NAMESPACES,
    interpolation: { escapeValue: false },
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
      lookupLocalStorage: LANGUAGE_STORAGE_KEY,
      convertDetectedLanguage,
    },
  })

export default i18next
