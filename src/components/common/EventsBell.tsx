import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { useTranslation } from 'react-i18next'
import { useTimerContext } from '../../context/TimerContext'
import type { AppEvent } from '../../context/TimerContext'
import { formatEventTimestamp } from '../../lib/format'

const EVENT_ICON: Record<AppEvent['type'], string> = {
  achievement: '🏆',
  level: '⭐',
}

const EVENT_ICON_CLASSES: Record<AppEvent['type'], string> = {
  achievement: 'bg-tertiary-bg text-on-tertiary-chip',
  level: 'bg-secondary-bg text-secondary-dark',
}

/**
 * US-60: central de eventos local (nível novo, conquista nova). Abrir marca tudo como visto.
 * Responsivo: tela cheia no mobile (`<lg`), drawer saindo da direita no desktop (`lg:`) — um
 * popover pequeno ancorado no sino não cabia no mobile (US-60-bis).
 *
 * O painel é renderizado via `createPortal` direto em `document.body`: o sino fica dentro do
 * `<header>` (`sticky`, `z-10`), que forma seu próprio contexto de empilhamento — um `fixed z-40`
 * aninhado ali dentro continuaria perdendo pro `z-20` da barra de áudio/promo (irmã no nível
 * raiz), porque o header inteiro (contexto) já perde pro `z-20` antes de qualquer z-index interno
 * ser comparado. O portal tira o painel de dentro do header, então ele compete como root-level.
 */
export function EventsBell() {
  const { t } = useTranslation('common')
  const { events, markEventsSeen } = useTimerContext()
  const [isOpen, setIsOpen] = useState(false)
  const unseenCount = events.filter((event) => !event.seen).length

  // Enquanto o painel ocupa a tela (mesmo padrão do menu hambúrguer em `AppShell.tsx`): Escape
  // fecha e o scroll do body trava (o painel já rola sozinho). Clique fora fecha via o próprio
  // backdrop abaixo — sem precisar de `useDismissOnOutsideClick` aqui, já que o painel não fica
  // mais aninhado junto do botão-gatilho (foi pro portal).
  useEffect(() => {
    if (!isOpen) return

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') setIsOpen(false)
    }

    document.addEventListener('keydown', handleKeyDown)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = ''
    }
  }, [isOpen])

  function handleToggle() {
    const next = !isOpen
    setIsOpen(next)
    if (next) {
      markEventsSeen()
    }
  }

  return (
    <>
      <button
        type="button"
        className="relative inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-full border border-border bg-surface text-base"
        onClick={handleToggle}
        aria-haspopup="dialog"
        aria-expanded={isOpen}
        aria-label={t('notifications.bellLabel')}
      >
        <span aria-hidden="true">🔔</span>
        {unseenCount > 0 && (
          <span className="absolute -right-1 -top-1 inline-flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-primary-dark px-1 text-style-label-sm text-on-primary">
            {unseenCount}
          </span>
        )}
      </button>

      {isOpen &&
        createPortal(
          <div className="fixed inset-0 z-40">
            <div
              data-testid="notifications-backdrop"
              className="absolute inset-0 bg-[rgba(46,36,61,0.45)]"
              onClick={() => setIsOpen(false)}
              aria-hidden="true"
            />

            <div
              role="dialog"
              aria-modal="true"
              aria-label={t('notifications.title')}
              className="absolute inset-0 flex flex-col bg-surface lg:inset-y-0 lg:left-auto lg:right-0 lg:w-[380px] lg:max-w-[90vw] lg:shadow-popover"
            >
              <div className="flex shrink-0 items-center justify-between border-b border-border px-4 py-3">
                <span className="text-style-headline-sm text-text-h">{t('notifications.title')}</span>
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full border border-border bg-surface"
                  aria-label={t('notifications.close')}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" aria-hidden="true">
                    <line x1="5" y1="5" x2="19" y2="19" />
                    <line x1="19" y1="5" x2="5" y2="19" />
                  </svg>
                </button>
              </div>

              {events.length === 0 ? (
                <div className="flex flex-1 flex-col items-center justify-center gap-2 px-4 text-center">
                  <span aria-hidden="true" className="text-3xl">
                    🌱
                  </span>
                  <p className="text-style-body-sm text-text-muted">{t('notifications.empty')}</p>
                </div>
              ) : (
                <ul className="m-0 flex flex-1 list-none flex-col gap-1 overflow-y-auto p-2">
                  {events.map((event) => {
                    const timestamp = formatEventTimestamp(t, event.createdAt)
                    return (
                      <li
                        key={event.id}
                        className="flex items-start gap-3 rounded-xl px-3 py-3 text-style-body-sm text-text hover:bg-bg-subtle"
                      >
                        <span
                          aria-hidden="true"
                          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[14px] ${EVENT_ICON_CLASSES[event.type]}`}
                        >
                          {EVENT_ICON[event.type]}
                        </span>
                        <span className="flex flex-col gap-0.5">
                          <span>{event.message}</span>
                          {timestamp && <span className="text-style-label-sm text-text-muted">{timestamp}</span>}
                        </span>
                      </li>
                    )
                  })}
                </ul>
              )}
            </div>
          </div>,
          document.body,
        )}
    </>
  )
}
