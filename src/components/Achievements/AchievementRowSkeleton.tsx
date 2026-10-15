import { Skeleton } from '../common/Skeleton'

interface AchievementRowSkeletonProps {
  /** Seção "Em progresso" mostra uma barra de progresso além de ícone/nome/descrição. */
  locked?: boolean
}

/** Espelha a linha real de ConquistasPage.tsx — ícone circular, nome e descrição em texto. */
export function AchievementRowSkeleton({ locked }: AchievementRowSkeletonProps) {
  return (
    <li aria-hidden="true" className="flex gap-2 rounded-lg border border-border bg-bg-subtle p-2">
      <Skeleton variant="circle" width={28} height={28} className="shrink-0" />
      <div className="flex flex-1 flex-col gap-1">
        <Skeleton variant="text" className="w-1/3" />
        <Skeleton variant="text" className="w-2/3" />
        {locked && <Skeleton variant="rect" className="h-2 w-full rounded-full" />}
      </div>
    </li>
  )
}
