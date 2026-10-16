import { useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useDismissOnOutsideClick } from '../../hooks/useDismissOnOutsideClick'
import { useLanguage } from '../../context/LanguageContext'
import { FlagIcon } from './FlagIcon'
import { LanguageMenuItems } from './LanguageMenuItems'

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

/**
 * Seletor de idioma autocontido (bandeira + código no gatilho, popover com as 3 opções) — usado na
 * página de Configurações. No cabeçalho e no menu do avatar, as opções (`LanguageMenuItems`) entram
 * direto dentro do `ProfileMenu`/`VisitorMenu`, sem este gatilho próprio (ver `ProfileMenu.tsx`).
 */
export function LanguageSwitcher() {
  const { t } = useTranslation('common')
  const { language } = useLanguage()
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  useDismissOnOutsideClick(containerRef, isOpen, () => setIsOpen(false))

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
          <LanguageMenuItems onSelect={() => setIsOpen(false)} />
        </div>
      )}
    </div>
  )
}
