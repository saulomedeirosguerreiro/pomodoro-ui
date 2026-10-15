import { Skeleton } from '../common/Skeleton'

const CARD_CLASSES = 'flex flex-col gap-2 rounded-2xl border border-border bg-surface p-4 shadow-card'

/** Espelha o card real de tarefa em TarefasPage.tsx — mesmas classes de card, só com conteúdo
 *  substituído por placeholders, pra não "pular" o layout quando os dados chegarem. */
export function TaskCardSkeleton() {
  return (
    <li className={CARD_CLASSES} aria-hidden="true">
      <div className="flex items-center justify-between gap-2">
        <Skeleton variant="text" className="w-2/3" />
        <Skeleton variant="rect" className="h-5 w-16 rounded-full" />
      </div>
      <Skeleton variant="text" lines={2} />
      <div className="flex items-center gap-2">
        <Skeleton variant="rect" className="h-5 w-14 rounded-full" />
        <Skeleton variant="text" className="w-20" />
      </div>
      <div className="flex gap-2">
        <Skeleton variant="rect" className="h-9 w-24 rounded-full" />
        <Skeleton variant="rect" className="h-9 w-20 rounded-full" />
      </div>
    </li>
  )
}
