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
 * Avatar do cabeçalho vira o gatilho de um menu (Perfil / Sair) — some ao clicar fora, com Escape,
 * ou ao navegar. O popover em si (posicionamento `absolute right-0 top-[calc(100%+8px)]`) espelha
 * o do `EventsBell`.
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
          className="absolute right-0 top-[calc(100%+8px)] z-30 w-[180px] rounded-2xl border border-border bg-surface p-2 shadow-popover"
        >
          <Link role="menuitem" to="/perfil" onClick={() => setIsOpen(false)} className={MENU_ITEM_CLASSES}>
            Perfil
          </Link>
          <button type="button" role="menuitem" onClick={handleLogoutClick} className={MENU_ITEM_CLASSES}>
            Sair
          </button>
        </div>
      )}
    </div>
  )
}
