import { useTranslation } from 'react-i18next'
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

function CheckIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 13l4 4L19 7" />
    </svg>
  )
}

interface LanguageMenuItemsProps {
  /** Chamado depois de escolher um idioma — tipicamente fecha o menu pai (avatar ou o próprio `LanguageSwitcher`). */
  onSelect: () => void
  /** Rótulo não-interativo acima das opções — omitido quando o menu pai (`LanguageSwitcher`) já tem
   *  seu próprio rótulo no botão-gatilho. */
  showLabel?: boolean
}

/**
 * As 3 opções de idioma (bandeira + nome nativo + check no ativo) — sem gatilho/popover próprio, pra
 * poder ser embutido tanto dentro do popover do `LanguageSwitcher` quanto direto dentro do menu do
 * avatar (`ProfileMenu`/`VisitorMenu`), sem aninhar um popover dentro do outro.
 */
export function LanguageMenuItems({ onSelect, showLabel = false }: LanguageMenuItemsProps) {
  const { t } = useTranslation('common')
  const { language, setLanguage } = useLanguage()

  function handleSelect(next: SupportedLanguage) {
    setLanguage(next)
    onSelect()
  }

  return (
    <>
      {showLabel && (
        <p className="px-3 pb-0.5 pt-1 text-style-label-sm text-text-muted">{t('language.switcherLabel')}</p>
      )}
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
    </>
  )
}
