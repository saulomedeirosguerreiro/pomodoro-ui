import { Button } from '../common/Button'
import { formatDateTime, formatDurationMinutes, statusLabel } from '../../lib/format'
import { SESSION_LABELS } from '../../lib/timerLogic'
import type { PomodoroSession } from '../../types/api'
import styles from './HistoryList.module.css'

interface HistoryListProps {
  items: PomodoroSession[] | null
  error: string | null
  onRetry: () => void
}

export function HistoryList({ items, error, onRetry }: HistoryListProps) {
  if (error) {
    return (
      <div className={styles.state}>
        <p>{error}</p>
        <Button variant="ghost" onClick={onRetry}>
          Tentar novamente
        </Button>
      </div>
    )
  }

  if (items === null) {
    return <p className={styles.state}>Carregando histórico…</p>
  }

  if (items.length === 0) {
    return <p className={styles.state}>Nenhuma sessão registrada ainda. Inicie um foco para começar.</p>
  }

  return (
    <ul className={styles.list}>
      {items.map((session) => (
        <li key={session.id} className={styles.row}>
          <span className={styles.duration}>{formatDurationMinutes(session.durationSeconds)}</span>
          <span className={styles.type}>{SESSION_LABELS[session.type]}</span>
          <span className={`${styles.status} ${session.status === 'concluido' ? styles.ok : styles.interrupted}`}>
            {statusLabel(session.status)}
          </span>
          <span className={styles.date}>{formatDateTime(session.completedAt)}</span>
        </li>
      ))}
    </ul>
  )
}
