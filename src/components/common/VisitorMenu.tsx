import { useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { useDismissOnOutsideClick } from '../../hooks/useDismissOnOutsideClick'
import { LanguageMenuItems } from './LanguageMenuItems'

interface VisitorMenuProps {
  firstName: string
  onSwitchPerson: () => void
}

const MENU_ITEM_CLASSES =
  'block w-full cursor-pointer rounded-lg px-3 py-2 text-left text-style-body-md text-text-h no-underline hover:bg-bg-subtle'

/**
 * Equivalente ao `ProfileMenu` pra quem está no modo visitante (sem conta) — mesmo avatar como
 * gatilho, mesmo popover (fecha com clique-fora/Escape), mesmo link de Configurações (Ajuda, Termos
 * e Privacidade moram dentro dela — ver doc do `ProfileMenu`), + "Trocar de pessoa". Configurações
 * fica sempre por último (depois do separador), igual no `ProfileMenu` — última opção fixa em
 * qualquer modo (conta ou visitante). "Acessar minha conta" é um botão à parte no header (CTA mais
 * importante pra quem é visitante, merece destaque próprio, não só um item de menu) — ver `AppShell.tsx`.
 */
export function VisitorMenu({ firstName, onSwitchPerson }: VisitorMenuProps) {
  const { t } = useTranslation('common')
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  useDismissOnOutsideClick(containerRef, isOpen, () => setIsOpen(false))

  function handleSwitchPersonClick() {
    setIsOpen(false)
    onSwitchPerson()
  }

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-haspopup="menu"
        aria-expanded={isOpen}
        aria-label={t('visitorMenu.ariaLabel')}
        className="flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-full bg-tertiary text-style-label-md text-on-primary"
      >
        {firstName.charAt(0).toUpperCase()}
      </button>

      {isOpen && (
        <div
          role="menu"
          aria-label={t('visitorMenu.ariaLabel')}
          className="absolute right-0 top-[calc(100%+8px)] z-30 w-[200px] rounded-2xl border border-border bg-surface p-2 shadow-popover"
        >
          <button type="button" role="menuitem" onClick={handleSwitchPersonClick} className={MENU_ITEM_CLASSES}>
            {t('visitorMenu.switchPerson')}
          </button>
          <div role="separator" className="my-1 border-t border-border" />
          <LanguageMenuItems showLabel onSelect={() => setIsOpen(false)} />
          <div role="separator" className="my-1 border-t border-border" />
          <Link role="menuitem" to="/configuracoes" onClick={() => setIsOpen(false)} className={MENU_ITEM_CLASSES}>
            {t('settingsLink')}
          </Link>
        </div>
      )}
    </div>
  )
}
