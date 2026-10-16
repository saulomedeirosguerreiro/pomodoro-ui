import { useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useDismissOnOutsideClick } from '../../hooks/useDismissOnOutsideClick'
import { useLanguage } from '../../context/LanguageContext'
import { FlagIcon } from './FlagIcon'
import { SUPPORTED_LANGUAGES, type SupportedLanguage } from '../../lib/language'

/** Nome nativo de cada idioma — sempre no próprio idioma (convenção padrão de seletor de idioma),
 *  nunca traduzido para o idioma atual da UI, por isso não mora nos arquivos de locale. */
const NATIVE_NAME: Record<SupportedLanguage, string> = {
  'pt-BR': 'Português',
  'en-US': 'English',
  es: 'Español',
}

const MENU_ITEM_CLASSES =
  'flex w-full cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-left text-style-body-md text-text-h hover:bg-bg-subtle'
const MENU_ITEM_ACTIVE_CLASSES = 'bg-primary-bg text-primary-dark hover:bg-primary-bg'

function ChevronDownIcon({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      width="14"
      height="14"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M6 9l6 6 6-6" />
    </svg>
  )
}

function CheckIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 13l4 4L19 7" />
    </svg>
  )
}

/**
 * Seletor de idioma em dropdown (bandeira + código no gatilho, bandeira + nome nativo + check no
 * item ativo) — mesmo padrão visual/estrutural do `ProfileMenu`/`VisitorMenu`/`EventsBell` (popover
 * `role="menu"` ancorado no botão, fecha com clique fora ou Escape), só com tokens de cor do tema
 * (`bg-surface`, `border-border`, `text-primary-dark`...) em vez de cores fixas, pra funcionar em
 * claro e escuro sem CSS próprio.
 */
export function LanguageSwitcher() {
  const { t } = useTranslation('common')
  const { language, setLanguage } = useLanguage()
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  useDismissOnOutsideClick(containerRef, isOpen, () => setIsOpen(false))

  function handleSelect(next: SupportedLanguage) {
    setLanguage(next)
    setIsOpen(false)
  }

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-haspopup="menu"
        aria-expanded={isOpen}
        aria-label={t('language.switcherLabel')}
        className="flex h-9 cursor-pointer items-center gap-1.5 rounded-full border border-border bg-surface px-3 text-style-label-md text-text-h hover:bg-bg-subtle"
      >
        <FlagIcon language={language} />
        <span>{t(`language.${language}`)}</span>
        <ChevronDownIcon className={`text-text-muted transition-transform duration-150 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div
          role="menu"
          aria-label={t('language.switcherLabel')}
          className="absolute right-0 top-[calc(100%+8px)] z-30 w-[180px] rounded-2xl border border-border bg-surface p-2 shadow-popover"
        >
          {SUPPORTED_LANGUAGES.map((lang) => {
            const isActive = lang === language
            return (
              <button
                key={lang}
                type="button"
                role="menuitemradio"
                aria-checked={isActive}
                onClick={() => handleSelect(lang)}
                className={`${MENU_ITEM_CLASSES} ${isActive ? MENU_ITEM_ACTIVE_CLASSES : ''}`}
              >
                <FlagIcon language={lang} />
                <span className="flex-1">{NATIVE_NAME[lang]}</span>
                {isActive && <CheckIcon />}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
