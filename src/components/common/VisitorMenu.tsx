import { useEffect, useRef, useState } from 'react'

interface VisitorMenuProps {
  firstName: string
  onSwitchPerson: () => void
}

const MENU_ITEM_CLASSES =
  'block w-full cursor-pointer rounded-lg px-3 py-2 text-left text-style-body-md text-text-h no-underline hover:bg-bg-subtle'

/**
 * Equivalente ao `ProfileMenu` pra quem está no modo visitante (sem conta) — mesmo avatar como
 * gatilho, mesmo popover (fecha com clique-fora/Escape). Só "Trocar de pessoa" aqui: "Acessar minha
 * conta" é um botão à parte no header (CTA mais importante pra quem é visitante, merece destaque
 * próprio, não só um item de menu) — ver `AppShell.tsx`.
 */
export function VisitorMenu({ firstName, onSwitchPerson }: VisitorMenuProps) {
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!isOpen) return

    function handlePointerDown(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') setIsOpen(false)
    }

    document.addEventListener('mousedown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('mousedown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen])

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
        aria-label="Menu do visitante"
        className="flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-full bg-tertiary text-style-label-md text-on-primary"
      >
        {firstName.charAt(0).toUpperCase()}
      </button>

      {isOpen && (
        <div
          role="menu"
          aria-label="Menu do visitante"
          className="absolute right-0 top-[calc(100%+8px)] z-30 w-[200px] rounded-2xl border border-border bg-surface p-2 shadow-popover"
        >
          <button type="button" role="menuitem" onClick={handleSwitchPersonClick} className={MENU_ITEM_CLASSES}>
            Trocar de pessoa
          </button>
        </div>
      )}
    </div>
  )
}
