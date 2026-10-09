import { Button } from '../common/Button'
import { formatDateTime, formatDurationMinutes, statusLabel } from '../../lib/format'
import { SESSION_LABELS } from '../../lib/timerLogic'
import type { PomodoroSession } from '../../types/api'

interface HistoryListProps {
  items: PomodoroSession[] | null
  error: string | null
  onRetry: () => void
}

const STATE_CLASSES = 'flex flex-col items-center gap-2 p-6 text-center text-text-muted'

export function HistoryList({ items, error, onRetry }: HistoryListProps) {
  if (error) {
    return (
      <div className={STATE_CLASSES}>
        <p>{error}</p>
        <Button variant="ghost" onClick={onRetry}>
          Tentar novamente
        </Button>
      </div>
    )
  }

  if (items === null) {
    return <p className={STATE_CLASSES}>Carregando histórico…</p>
  }

  if (items.length === 0) {
    return <p className={STATE_CLASSES}>Nenhuma sessão registrada ainda. Inicie um foco para começar.</p>
  }

  return (
    <ul className="m-0 flex list-none flex-col gap-1 p-0">
      {items.map((session) => (
        <li
          key={session.id}
          className="grid grid-cols-[70px_1fr_auto_auto] items-center gap-2 border-b border-border px-4 py-2 text-sm max-[480px]:grid-cols-2 max-[480px]:[grid-template-areas:'type_duration'_'status_date']"
        >
          <span className="[font-variant-numeric:tabular-nums] text-text-muted max-[480px]:text-right max-[480px]:[grid-area:duration]">
            {formatDurationMinutes(session.durationSeconds)}
          </span>
          <span className="max-[480px]:[grid-area:type]">{SESSION_LABELS[session.type]}</span>
          <span
            className={`font-semibold max-[480px]:[grid-area:status] ${session.status === 'concluido' ? 'text-success' : 'text-danger'}`}
          >
            {statusLabel(session.status)}
          </span>
          <span className="text-[13px] text-text-muted max-[480px]:text-right max-[480px]:[grid-area:date]">
            {formatDateTime(session.completedAt)}
          </span>
        </li>
      ))}
    </ul>
  )
}
