import { useState } from 'react'
import { useTimerContext } from '../../context/TimerContext'

/** US-60: central de eventos local (nível novo, conquista nova). Abrir marca tudo como visto. */
export function EventsBell() {
  const { events, markEventsSeen } = useTimerContext()
  const [isOpen, setIsOpen] = useState(false)
  const unseenCount = events.filter((event) => !event.seen).length

  function handleToggle() {
    const next = !isOpen
    setIsOpen(next)
    if (next) {
      markEventsSeen()
    }
  }

  return (
    <div className="relative">
      <button
        type="button"
        className="relative inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-full border border-border bg-surface text-base"
        onClick={handleToggle}
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
          className="absolute right-0 top-[calc(100%+8px)] z-30 w-[260px] rounded-2xl border border-border bg-surface p-2 shadow-popover"
          role="menu"
        >
          {events.length === 0 ? (
            <p className="text-style-body-sm text-text-muted">Nenhum evento por aqui ainda.</p>
          ) : (
            <ul className="m-0 flex list-none flex-col gap-1 p-0">
              {events.map((event) => (
                <li key={event.id} className="rounded-sm bg-bg-subtle px-2 py-1 text-style-body-sm text-text">
                  {event.message}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}
