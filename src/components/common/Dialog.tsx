import { useEffect, useId, useRef, type KeyboardEvent, type ReactNode } from 'react'
import styles from './Dialog.module.css'

interface DialogProps {
  titleText: string
  children: ReactNode
  /** Chamado ao fechar via `Escape` — omitir junto com `dismissible={false}` quando a ação exigir uma escolha explícita. */
  onDismiss?: () => void
  /** Quando `false`, `Escape` não fecha o diálogo. Padrão `true`. */
  dismissible?: boolean
}

/**
 * Primitivo de modal acessível — não existia no projeto antes desta frente. Mínimo necessário:
 * `role="dialog"` + `aria-modal="true"` + `aria-labelledby`, foco inicial no primeiro elemento
 * interativo, devolução de foco ao elemento que abriu o diálogo ao desmontar, fechar com `Escape`
 * quando a ação permitir cancelamento. Reutilizável além da migração (ex.: confirmações destrutivas).
 */
export function Dialog({ titleText, children, onDismiss, dismissible = true }: DialogProps) {
  const titleId = useId()
  const dialogRef = useRef<HTMLDivElement>(null)
  const previouslyFocusedElementRef = useRef<HTMLElement | null>(null)

  useEffect(() => {
    previouslyFocusedElementRef.current = document.activeElement as HTMLElement | null

    const focusableElement = dialogRef.current?.querySelector<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
    )
    focusableElement?.focus()

    return () => {
      previouslyFocusedElementRef.current?.focus()
    }
  }, [])

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === 'Escape' && dismissible) {
      onDismiss?.()
    }
  }

  return (
    <div className={styles.overlay} onKeyDown={handleKeyDown}>
      <div ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby={titleId} className={styles.dialog}>
        <h2 id={titleId} className={styles.title}>
          {titleText}
        </h2>
        {children}
      </div>
    </div>
  )
}
