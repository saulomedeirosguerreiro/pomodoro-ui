import { speciesForIndex } from '../../lib/gardenSpecies'

interface TodaysGardenCardProps {
  maturedCount: number
  isGrowing: boolean
}

const PLANT_BASE_CLASSES =
  'flex flex-col items-center gap-0.5 rounded-lg border border-border bg-bg-subtle p-2 text-center'

export function TodaysGardenCard({ maturedCount, isGrowing }: TodaysGardenCardProps) {
  const matured = Array.from({ length: maturedCount }, (_, index) => speciesForIndex(index))

  return (
    <section className="flex w-full flex-col gap-2 rounded-2xl border border-border bg-surface p-4 shadow-card">
      <div className="flex items-center justify-between">
        <h2 className="text-style-headline-sm">🌱 Jardim de Foco de Hoje</h2>
        <span className="rounded-full bg-secondary-bg px-2 py-0.5 text-style-label-sm text-secondary-dark">
          {maturedCount} colheitas
        </span>
      </div>
      <p className="text-style-body-sm text-text-muted">
        Cada sessão completada faz florescer um amigo no seu canteiro!
      </p>

      {matured.length === 0 && !isGrowing ? (
        <p className="py-4 text-center text-style-body-sm text-text-muted">
          Seu canteiro está esperando a primeira semente de hoje.
        </p>
      ) : (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(84px,1fr))] gap-2">
          {matured.map((species, index) => (
            <div key={index} className={PLANT_BASE_CLASSES}>
              <span className="text-[28px]" aria-hidden="true">
                {species.emoji}
              </span>
              <span className="max-w-full overflow-hidden text-ellipsis whitespace-nowrap text-style-label-sm text-text-h">
                {species.name}
              </span>
              <span className="text-style-label-sm text-secondary-dark">Maduro</span>
            </div>
          ))}
          {isGrowing && (
            <div className={`${PLANT_BASE_CLASSES} border-tertiary`}>
              <span className="text-[28px]" aria-hidden="true">
                🌱
              </span>
              <span className="max-w-full overflow-hidden text-ellipsis whitespace-nowrap text-style-label-sm text-text-h">
                Semente
              </span>
              <span className="text-style-label-sm text-tertiary">Brotando</span>
            </div>
          )}
        </div>
      )}
    </section>
  )
}
