import { useTranslation } from 'react-i18next'
import { PROMOS } from '../../lib/promos'
import { usePromoRotation } from '../../hooks/usePromoRotation'
import { PromoIcon } from './PromoIcon'
import { trackEvent } from '../../lib/analytics'

interface PromoCardProps {
  secondsPerAd: number
}

/** Card de divulgação cruzada na sidebar desktop, logo acima de Configurações. */
export function PromoCard({ secondsPerAd }: PromoCardProps) {
  const { t } = useTranslation('promos')
  const { current, index, dots } = usePromoRotation(secondsPerAd, PROMOS)

  return (
    <section
      aria-label={t('ariaLabel')}
      className="flex flex-col gap-3 rounded-lg border border-border bg-bg-subtle p-4"
    >
      <div className="flex items-center justify-end">
        <span className="text-style-label-sm text-text-muted">
          {t('pageIndicator', { current: index + 1, total: PROMOS.length })}
        </span>
      </div>

      <div className="flex items-center gap-3">
        <PromoIcon kind={current.kind} />
        <div className="min-w-0">
          <p className="text-style-label-sm text-text-muted">{t(`items.${current.id}.label`)}</p>
          <p className="overflow-hidden text-ellipsis whitespace-nowrap text-style-label-lg text-text-h">
            {t(`items.${current.id}.title`)}
          </p>
          <p className="text-style-body-sm text-text-muted">{t(`items.${current.id}.description`)}</p>
        </div>
      </div>

      <a
        href={current.url}
        target="_blank"
        rel="noopener noreferrer"
        onClick={() =>
          trackEvent('promo_click', {
            promo_id: current.id,
            promo_kind: current.kind,
            promo_title: t(`items.${current.id}.title`),
            placement: 'sidebar',
          })
        }
        className="flex min-h-[44px] items-center justify-center gap-2 rounded-lg bg-text-h px-4 text-style-label-lg text-bg no-underline"
      >
        {t(`items.${current.id}.cta`)}
      </a>

      <div className="flex justify-center gap-1">
        {dots.map((dot) => (
          <button
            key={dot.index}
            type="button"
            onClick={dot.select}
            aria-label={t('dotAriaLabel', { index: dot.index + 1 })}
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
