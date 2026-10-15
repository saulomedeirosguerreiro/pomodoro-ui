import { PROMOS } from '../../lib/promos'
import { usePromoRotation } from '../../hooks/usePromoRotation'
import { PromoIcon } from './PromoIcon'
import { trackEvent } from '../../lib/analytics'

interface PromoBarProps {
  secondsPerAd: number
}

/**
 * Conteúdo da divulgação cruzada no mobile — sem posicionamento/fundo próprios: o `AppShell` a
 * empilha, sem espaço, bem acima da barra do mini-player, as duas dentro do mesmo bloco fixo no
 * rodapé (um `border-t` entre elas faz de divisor).
 */
export function PromoBar({ secondsPerAd }: PromoBarProps) {
  const { current, dots } = usePromoRotation(secondsPerAd, PROMOS)

  return (
    <section aria-label="Divulgação" className="flex flex-col gap-2 p-3 pb-2">
      <div className="flex items-center gap-3">
        <PromoIcon kind={current.kind} size={42} />
        <div className="min-w-0 flex-1">
          <p className="text-style-label-sm uppercase tracking-wide text-primary-dark">{current.label}</p>
          <p className="overflow-hidden text-ellipsis whitespace-nowrap text-style-label-lg text-text-h">
            {current.title}
          </p>
          <p className="overflow-hidden text-ellipsis whitespace-nowrap text-style-body-sm text-text-muted">
            {current.description}
          </p>
        </div>
        <a
          href={current.url}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() =>
            trackEvent('promo_click', {
              promo_id: current.id,
              promo_kind: current.kind,
              promo_title: current.title,
              placement: 'mobile_bar',
            })
          }
          className="flex min-h-[44px] shrink-0 items-center rounded-lg bg-text-h px-3 text-style-label-md text-bg no-underline"
        >
          {current.cta}
        </a>
      </div>

      <div className="flex justify-center gap-1">
        {dots.map((dot) => (
          <button
            key={dot.index}
            type="button"
            onClick={dot.select}
            aria-label={dot.ariaLabel}
            className="flex h-5 w-5 items-center justify-center border-0 bg-transparent p-0"
          >
            <span
              className={`block h-[6px] rounded-full ${dot.isActive ? 'w-[16px] bg-primary-dark' : 'w-[6px] bg-border'}`}
            />
          </button>
        ))}
      </div>
    </section>
  )
}
