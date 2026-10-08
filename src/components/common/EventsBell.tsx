import { useState } from 'react'
import { useTimerContext } from '../../context/TimerContext'
import styles from './EventsBell.module.css'

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
    <div className={styles.wrapper}>
      <button type="button" className={styles.bellButton} onClick={handleToggle} aria-label="Notificações">
        <span aria-hidden="true">🔔</span>
        {unseenCount > 0 && <span className={styles.badge}>{unseenCount}</span>}
      </button>

      {isOpen && (
        <div className={styles.dropdown} role="menu">
          {events.length === 0 ? (
            <p className={styles.empty}>Nenhum evento por aqui ainda.</p>
          ) : (
            <ul className={styles.list}>
              {events.map((event) => (
                <li key={event.id} className={styles.item}>
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
