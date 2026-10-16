import { useTranslation } from 'react-i18next'
import { Button } from '../common/Button'
import { formatDateTime, formatDurationMinutes, statusLabel } from '../../lib/format'
import { sessionLabel } from '../../lib/timerLogic'
import type { PomodoroSession } from '../../types/api'
import { HistoryRowSkeleton } from './HistoryRowSkeleton'

interface HistoryListProps {
  items: PomodoroSession[] | null
  error: string | null
  onRetry: () => void
}

const STATE_CLASSES = 'flex flex-col items-center gap-2 p-6 text-center text-text-muted'

export function HistoryList({ items, error, onRetry }: HistoryListProps) {
  const { t } = useTranslation(['history', 'timer'])

  if (error) {
    return (
      <div className={STATE_CLASSES}>
        <p>{error}</p>
        <Button variant="ghost" onClick={onRetry}>
          {t('retry')}
        </Button>
      </div>
    )
  }

  if (items === null) {
    return (
      <div role="status" aria-live="polite" aria-busy="true">
        <span className="sr-only">{t('loading')}</span>
        <ul className="m-0 flex list-none flex-col gap-1 p-0">
          {Array.from({ length: 4 }, (_, index) => (
            <HistoryRowSkeleton key={index} />
          ))}
        </ul>
      </div>
    )
  }

  if (items.length === 0) {
    return <p className={STATE_CLASSES}>{t('empty')}</p>
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
          <span className="max-[480px]:[grid-area:type]">{sessionLabel(t, session.type)}</span>
          <span
            className={`font-semibold max-[480px]:[grid-area:status] ${session.status === 'concluido' ? 'text-success' : 'text-danger'}`}
          >
            {statusLabel(t, session.status)}
          </span>
          <span className="text-[13px] text-text-muted max-[480px]:text-right max-[480px]:[grid-area:date]">
            {formatDateTime(session.completedAt)}
          </span>
        </li>
      ))}
    </ul>
  )
}
