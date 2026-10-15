import { Skeleton } from '../common/Skeleton'

/** Espelha a linha real de HistoryList.tsx (grid de 4 colunas: duração, tipo, status, data). */
export function HistoryRowSkeleton() {
  return (
    <li
      aria-hidden="true"
      className="grid grid-cols-[70px_1fr_auto_auto] items-center gap-2 border-b border-border px-4 py-2"
    >
      <Skeleton variant="text" className="w-10" />
      <Skeleton variant="text" className="w-24" />
      <Skeleton variant="text" className="w-16" />
      <Skeleton variant="text" className="w-20" />
    </li>
  )
}
