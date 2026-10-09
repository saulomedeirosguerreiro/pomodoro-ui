import { PROMOS } from '../../lib/promos'
import { usePromoRotation } from '../../hooks/usePromoRotation'
import { PromoIcon } from './PromoIcon'

interface PromoCardProps {
  secondsPerAd: number
  isDimmed: boolean
}

/** Card de divulgação cruzada na sidebar desktop, logo acima de Configurações. */
export function PromoCard({ secondsPerAd, isDimmed }: PromoCardProps) {
  const { current, index, dots } = usePromoRotation(secondsPerAd, PROMOS)

  return (
    <section
      aria-label="Divulgação"
      className="flex flex-col gap-3 rounded-lg border border-border bg-bg-subtle p-4 transition-opacity duration-300"
      style={{ opacity: isDimmed ? 0.45 : 1 }}
    >
      <div className="flex items-center justify-end">
        <span className="text-style-label-sm text-text-muted">
          {index + 1} de {PROMOS.length}
        </span>
      </div>

      <div className="flex items-center gap-3">
        <PromoIcon kind={current.kind} />
        <div className="min-w-0">
          <p className="text-style-label-sm text-text-muted">{current.label}</p>
          <p className="overflow-hidden text-ellipsis whitespace-nowrap text-style-label-lg text-text-h">
            {current.title}
          </p>
          <p className="text-style-body-sm text-text-muted">{current.description}</p>
        </div>
      </div>

      <a
        href={current.url}
        target="_blank"
        rel="noopener noreferrer"
        className="flex min-h-[44px] items-center justify-center gap-2 rounded-lg bg-text-h px-4 text-style-label-lg text-bg no-underline"
      >
        {current.cta}
      </a>

      <div className="flex justify-center gap-1">
        {dots.map((dot) => (
          <button
            key={dot.index}
            type="button"
            onClick={dot.select}
            aria-label={dot.ariaLabel}
            className="flex h-6 w-6 items-center justify-center border-0 bg-transparent p-0"
          >
            <span
              className={`block h-[7px] rounded-full ${dot.isActive ? 'w-[18px] bg-primary-dark' : 'w-[7px] bg-border'}`}
            />
          </button>
        ))}
      </div>
    </section>
  )
}
