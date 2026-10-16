import '@testing-library/jest-dom/vitest'
import i18n from '../i18n'

// jsdom relata `navigator.language` como `en-US`: sem isso, o `LanguageDetector` pegaria esse valor
// e quebraria todo teste existente que faz assert em texto pt-BR (o idioma padrão do app).
await i18n.changeLanguage('pt-BR')
