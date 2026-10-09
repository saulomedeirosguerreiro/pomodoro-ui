import { useState } from 'react'
import { Checkbox } from '../components/common/Checkbox'
import { FormField } from '../components/common/FormField'
import { useSettings } from '../context/SettingsContext'

const CARD_CLASSES = 'flex flex-col gap-2 rounded-2xl border border-border bg-surface p-4 shadow-card'

const PROMO_SECONDS_MIN = 3
const PROMO_SECONDS_MAX = 60

function clampPromoSeconds(raw: string, fallback: number): number {
  const parsed = Number.parseInt(raw, 10)
  if (!Number.isFinite(parsed)) {
    return fallback
  }
  return Math.min(PROMO_SECONDS_MAX, Math.max(PROMO_SECONDS_MIN, parsed))
}

/** Painel interno, sem link em nenhum menu — só por URL direta (/tweaks). */
export function TweaksPage() {
  const { settings, updateSettings } = useSettings()
  const [promoSecondsInput, setPromoSecondsInput] = useState(String(settings.promoSecondsPerAd))

  function handlePromoSecondsBlur() {
    const clamped = clampPromoSeconds(promoSecondsInput, settings.promoSecondsPerAd)
    setPromoSecondsInput(String(clamped))
    updateSettings({ promoSecondsPerAd: clamped })
  }

  return (
    <div className="mx-auto flex max-w-[640px] flex-col gap-4">
      <div>
        <h1>Tweaks</h1>
        <p className="text-style-body-sm text-text-muted">Ajustes internos, sem link em nenhum menu.</p>
      </div>

      <section className={CARD_CLASSES}>
        <h2 className="flex items-center gap-2 text-style-headline-sm">
          <span aria-hidden="true">📣</span> Divulgação
        </h2>
        <FormField
          label="Segundos por anúncio"
          name="promoSecondsPerAd"
          type="number"
          min={PROMO_SECONDS_MIN}
          max={PROMO_SECONDS_MAX}
          step={1}
          value={promoSecondsInput}
          onChange={(e) => setPromoSecondsInput(e.target.value)}
          onBlur={handlePromoSecondsBlur}
        />
        <Checkbox
          checked={settings.promoFocusPreview}
          onChange={(checked) => updateSettings({ promoFocusPreview: checked })}
          label="Foco ativo"
        />
        <p className="text-style-body-sm text-text-muted">
          Esmaece o card/barra de divulgação, só para pré-visualizar como fica durante uma sessão de foco — uma sessão
          de foco de verdade já esmaece sozinha, sem precisar deste toggle.
        </p>
      </section>
    </div>
  )
}
