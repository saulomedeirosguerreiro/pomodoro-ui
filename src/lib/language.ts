import { DEFAULT_LANGUAGE, SUPPORTED_LANGUAGES, type SupportedLanguage } from '../i18n'

export type { SupportedLanguage }
export { DEFAULT_LANGUAGE, SUPPORTED_LANGUAGES }

export function isSupportedLanguage(value: string | null | undefined): value is SupportedLanguage {
  return (SUPPORTED_LANGUAGES as readonly string[]).includes(value ?? '')
}
