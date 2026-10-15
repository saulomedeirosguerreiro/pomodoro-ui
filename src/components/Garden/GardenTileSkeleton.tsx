import { Skeleton } from '../common/Skeleton'

/** Espelha o tile real da grid "Minha coleção" em JardimPage.tsx. */
export function GardenTileSkeleton() {
  return (
    <div
      aria-hidden="true"
      className="flex flex-col items-center gap-0.5 rounded-lg border border-border bg-bg-subtle p-2 text-center"
    >
      <Skeleton variant="circle" width={26} height={26} />
      <Skeleton variant="text" className="w-14" />
      <Skeleton variant="text" className="w-8" />
    </div>
  )
}
