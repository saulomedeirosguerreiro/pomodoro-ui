import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react'
import i18n from '../i18n'
import { DEFAULT_LANGUAGE, isSupportedLanguage, type SupportedLanguage } from '../lib/language'

interface LanguageContextValue {
  language: SupportedLanguage
  setLanguage: (language: SupportedLanguage) => void
}

const LanguageContext = createContext<LanguageContextValue | undefined>(undefined)

/** `i18next-browser-languagedetector` já resolveu `i18n.language` (localStorage ou navegador,
 *  normalizado pelo `convertDetectedLanguage`) antes deste provider montar — ver `src/i18n/index.ts`,
 *  importado como side-effect em `main.tsx` antes do `createRoot`. */
function resolveCurrentLanguage(): SupportedLanguage {
  const current = i18n.resolvedLanguage ?? i18n.language
  return isSupportedLanguage(current) ? current : DEFAULT_LANGUAGE
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<SupportedLanguage>(() => resolveCurrentLanguage())

  useEffect(() => {
    document.documentElement.lang = language
  }, [language])

  useEffect(() => {
    function handleLanguageChanged(lng: string) {
      if (isSupportedLanguage(lng)) {
        setLanguageState(lng)
      }
    }
    i18n.on('languageChanged', handleLanguageChanged)
    return () => {
      i18n.off('languageChanged', handleLanguageChanged)
    }
  }, [])

  // Troca de idioma persiste sozinha: o `LanguageDetector` grava em `localStorage` (`caches:
  // ['localStorage']`, `src/i18n/index.ts`) toda vez que `i18n.changeLanguage` dispara.
  const setLanguage = useCallback((next: SupportedLanguage) => {
    i18n.changeLanguage(next)
  }, [])

  return <LanguageContext.Provider value={{ language, setLanguage }}>{children}</LanguageContext.Provider>
}

export function useLanguage(): LanguageContextValue {
  const context = useContext(LanguageContext)
  if (!context) {
    throw new Error('useLanguage precisa ser usado dentro de um LanguageProvider.')
  }
  return context
}
