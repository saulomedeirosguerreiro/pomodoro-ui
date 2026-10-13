import { useRef, useState } from 'react'
import { useDismissOnOutsideClick } from '../../hooks/useDismissOnOutsideClick'
import { useTimerContext } from '../../context/TimerContext'
import type { AppEvent } from '../../context/TimerContext'

const EVENT_ICON: Record<AppEvent['type'], string> = {
  achievement: '🏆',
  level: '⭐',
}

const EVENT_ICON_CLASSES: Record<AppEvent['type'], string> = {
  achievement: 'bg-tertiary-bg text-on-tertiary-chip',
  level: 'bg-secondary-bg text-secondary-dark',
}

/** US-60: central de eventos local (nível novo, conquista nova). Abrir marca tudo como visto. */
export function EventsBell() {
  const { events, markEventsSeen } = useTimerContext()
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const unseenCount = events.filter((event) => !event.seen).length

  useDismissOnOutsideClick(containerRef, isOpen, () => setIsOpen(false))

  function handleToggle() {
    const next = !isOpen
    setIsOpen(next)
    if (next) {
      markEventsSeen()
    }
  }

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        className="relative inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-full border border-border bg-surface text-base"
        onClick={handleToggle}
        aria-haspopup="menu"
        aria-expanded={isOpen}
        aria-label="Notificações"
      >
        <span aria-hidden="true">🔔</span>
        {unseenCount > 0 && (
          <span className="absolute -right-1 -top-1 inline-flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-primary-dark px-1 text-style-label-sm text-on-primary">
            {unseenCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div
          className="absolute right-0 top-[calc(100%+12px)] z-30 w-[300px] rounded-2xl border border-border bg-surface shadow-popover"
          role="menu"
          aria-label="Notificações"
        >
          <span
            aria-hidden="true"
            className="absolute -top-[7px] right-3 h-3 w-3 rotate-45 border-l border-t border-border bg-surface"
          />

          <p className="relative rounded-t-2xl bg-surface px-3 py-2 text-style-label-md text-text-h">Notificações</p>
          <div className="border-b border-border" />

          {events.length === 0 ? (
            <div className="flex flex-col items-center gap-2 px-3 py-8 text-center">
              <span aria-hidden="true" className="text-2xl">
                🌱
              </span>
              <p className="text-style-body-sm text-text-muted">Nenhum evento por aqui ainda.</p>
            </div>
          ) : (
            <ul className="m-0 flex max-h-[320px] list-none flex-col gap-1 overflow-y-auto p-2">
              {events.map((event) => (
                <li
                  key={event.id}
                  className="flex items-start gap-2 rounded-xl px-2 py-2 text-style-body-sm text-text hover:bg-bg-subtle"
                >
                  <span
                    aria-hidden="true"
                    className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[13px] ${EVENT_ICON_CLASSES[event.type]}`}
                  >
                    {EVENT_ICON[event.type]}
                  </span>
                  <span className="pt-0.5">{event.message}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}
