import i18next from 'i18next'
import LanguageDetector from 'i18next-browser-languagedetector'
import { beforeEach, describe, expect, it } from 'vitest'
import { convertDetectedLanguage, DEFAULT_LANGUAGE, LANGUAGE_STORAGE_KEY, SUPPORTED_LANGUAGES } from './index'

/** Mocka `navigator.language` E `navigator.languages` — o detector de navegador lê `languages`
 *  primeiro (só Chrome tem; é um array), caindo pra `language` depois. Sem mockar os dois, o
 *  `languages` default do jsdom (`['en-US']`) continuaria entrando na detecção junto do valor mockado. */
function setNavigatorLanguage(lang: string) {
  Object.defineProperty(window.navigator, 'language', { value: lang, configurable: true })
  Object.defineProperty(window.navigator, 'languages', { value: [lang], configurable: true })
}

/** Instância isolada do i18next, com a MESMA config de detecção de `src/i18n/index.ts` — a instância
 *  global já roda em `pt-BR` fixo nos testes (`src/test/setup.ts`), então testar a detecção de
 *  verdade exige uma instância própria, sem esse override. */
async function detectWithFreshInstance(): Promise<string> {
  const instance = i18next.createInstance()
  await instance.use(LanguageDetector).init({
    resources: { 'pt-BR': {}, 'en-US': {}, es: {} },
    supportedLngs: SUPPORTED_LANGUAGES,
    fallbackLng: DEFAULT_LANGUAGE,
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
      lookupLocalStorage: LANGUAGE_STORAGE_KEY,
      convertDetectedLanguage,
    },
  })
  return instance.language
}

describe('convertDetectedLanguage', () => {
  it('normaliza variantes conhecidas para um dos 3 idiomas suportados', () => {
    expect(convertDetectedLanguage('en-GB')).toBe('en-US')
    expect(convertDetectedLanguage('en-US')).toBe('en-US')
    expect(convertDetectedLanguage('en')).toBe('en-US')
    expect(convertDetectedLanguage('es-MX')).toBe('es')
    expect(convertDetectedLanguage('ES')).toBe('es')
    expect(convertDetectedLanguage('pt-PT')).toBe('pt-BR')
    expect(convertDetectedLanguage('pt')).toBe('pt-BR')
  })

  it('idioma sem suporte cai no padrão (pt-BR)', () => {
    expect(convertDetectedLanguage('fr-FR')).toBe('pt-BR')
    expect(convertDetectedLanguage('de')).toBe('pt-BR')
  })
})

describe('detecção automática do idioma (primeira visita, sem preferência salva)', () => {
  // `src/test/setup.ts` já chamou `i18n.changeLanguage('pt-BR')` na instância global antes de
  // qualquer teste rodar — como essa instância tem `caches: ['localStorage']`, isso grava
  // `pomogarden:language=pt-BR` no localStorage como efeito colateral. Sem limpar ANTES de cada
  // teste (não só depois), o primeiro teste deste bloco herdaria essa gravação e "ganharia" da
  // detecção por navegador mesmo sem nenhum teste ter configurado isso de propósito.
  beforeEach(() => {
    localStorage.removeItem(LANGUAGE_STORAGE_KEY)
  })

  it('usa o idioma do navegador normalizado quando não há preferência salva', async () => {
    setNavigatorLanguage('es-MX')
    await expect(detectWithFreshInstance()).resolves.toBe('es')
  })

  it('idioma do navegador sem suporte cai no padrão pt-BR', async () => {
    setNavigatorLanguage('fr-FR')
    await expect(detectWithFreshInstance()).resolves.toBe('pt-BR')
  })

  it('preferência salva no localStorage tem prioridade sobre o idioma do navegador', async () => {
    localStorage.setItem(LANGUAGE_STORAGE_KEY, 'es')
    setNavigatorLanguage('en-US')
    await expect(detectWithFreshInstance()).resolves.toBe('es')
  })
})
