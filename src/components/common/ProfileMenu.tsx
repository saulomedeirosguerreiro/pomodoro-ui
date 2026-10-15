import { useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useDismissOnOutsideClick } from '../../hooks/useDismissOnOutsideClick'

interface ProfileMenuProps {
  firstName: string
  onLogout: () => void
}

const MENU_ITEM_CLASSES =
  'block w-full cursor-pointer rounded-lg px-3 py-2 text-left text-style-body-md text-text-h no-underline hover:bg-bg-subtle'

/**
 * Avatar do cabeçalho vira o gatilho de um menu (Perfil, Configurações e Sair, nessa ordem) — some
 * ao clicar fora, com Escape, ou ao navegar. Configurações vive aqui (e não na sidebar) porque o
 * header é sempre visível, sem disputa de altura com nav principal e promo — ver `AppShell.tsx`.
 * Ajuda, Termos e Privacidade não têm item próprio aqui: moram dentro de Configurações (seção "Ajuda
 * e Legal", `ConfiguracoesPage.tsx`), pra não inflar esse menu com links de baixíssima frequência.
 * Sair fica depois do separador, por ser a única ação "destrutiva" do menu (encerra a sessão) — as
 * demais são só navegação. No `VisitorMenu` (sem Sair), Configurações continua como última opção. O
 * popover em si (posicionamento `absolute right-0 top-[calc(100%+8px)]`) espelha o do `EventsBell`.
 */
export function ProfileMenu({ firstName, onLogout }: ProfileMenuProps) {
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  useDismissOnOutsideClick(containerRef, isOpen, () => setIsOpen(false))

  function handleLogoutClick() {
    setIsOpen(false)
    onLogout()
  }

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-haspopup="menu"
        aria-expanded={isOpen}
        aria-label="Menu da conta"
        className="flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-full bg-tertiary text-style-label-md text-on-primary"
      >
        {firstName.charAt(0).toUpperCase()}
      </button>

      {isOpen && (
        <div
          role="menu"
          aria-label="Menu da conta"
          className="absolute right-0 top-[calc(100%+8px)] z-30 w-[200px] rounded-2xl border border-border bg-surface p-2 shadow-popover"
        >
          <Link role="menuitem" to="/perfil" onClick={() => setIsOpen(false)} className={MENU_ITEM_CLASSES}>
            Perfil
          </Link>
          <Link role="menuitem" to="/configuracoes" onClick={() => setIsOpen(false)} className={MENU_ITEM_CLASSES}>
            Configurações
          </Link>
          <div role="separator" className="my-1 border-t border-border" />
          <button type="button" role="menuitem" onClick={handleLogoutClick} className={MENU_ITEM_CLASSES}>
            Sair
          </button>
        </div>
      )}
    </div>
  )
}
