import { Trans, useTranslation } from 'react-i18next'
import { useSettings } from '../context/SettingsContext'
import { formatDurationMinutes } from '../lib/format'
import { FOCUS_XP, REST_XP, SEEDS_PER_CYCLE_BONUS, SEEDS_PER_FOCUS, XP_PER_LEVEL_MULTIPLIER } from '../lib/gameConstants'
import { GARDEN_SPECIES } from '../lib/gardenSpecies'
import { FOCI_PER_LONG_BREAK, sessionDurationsSecondsFrom } from '../lib/timerLogic'

const CARD_CLASSES = 'flex flex-col gap-2 rounded-2xl border border-border bg-surface p-4 shadow-card'

export function AjudaPage() {
  const { t } = useTranslation('legal')
  const { settings } = useSettings()
  const durations = sessionDurationsSecondsFrom(
    settings.focusMinutes,
    settings.shortBreakMinutes,
    settings.longBreakMinutes,
  )

  const focusSeeds = t('seedCount', { count: SEEDS_PER_FOCUS })
  const cycleSeeds = t('seedCount', { count: SEEDS_PER_CYCLE_BONUS })

  return (
    <div className="mx-auto flex max-w-[640px] flex-col gap-4">
      <div>
        <h1>{t('help.title')}</h1>
        <p className="text-style-body-sm text-text-muted">{t('help.subtitle')}</p>
      </div>

      <section className={CARD_CLASSES}>
        <h2 className="flex items-center gap-2 text-style-headline-sm">
          <span aria-hidden="true">📖</span> {t('help.pomodoroHeading')}
        </h2>
        <p className="text-style-body-md text-text">
          <Trans
            t={t}
            i18nKey="help.pomodoroBody"
            values={{
              focusDuration: formatDurationMinutes(durations.foco),
              shortBreakDuration: formatDurationMinutes(durations.descanso_curto),
              longBreakDuration: formatDurationMinutes(durations.descanso_longo),
              longBreakEvery: FOCI_PER_LONG_BREAK,
            }}
            components={[<strong key="0" />, <strong key="1" />, <strong key="2" />]}
          />
        </p>
      </section>

      <section className={CARD_CLASSES}>
        <h2 className="flex items-center gap-2 text-style-headline-sm">
          <span aria-hidden="true">🔁</span> {t('help.cycleHeading')}
        </h2>
        <p className="text-style-body-md text-text">
          {t('help.cycleBody', { longBreakEvery: FOCI_PER_LONG_BREAK })}
        </p>
      </section>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <section className={CARD_CLASSES}>
          <h2 className="flex items-center gap-2 text-style-headline-sm">
            <span aria-hidden="true">⭐</span> {t('help.xpHeading')}
          </h2>
          <p className="text-style-body-md text-text">
            <Trans
              t={t}
              i18nKey="help.xpBody"
              values={{ focusXp: FOCUS_XP, restXp: REST_XP, xpMultiplier: XP_PER_LEVEL_MULTIPLIER }}
              components={[<strong key="0" />, <strong key="1" />]}
            />
          </p>
        </section>

        <section className={CARD_CLASSES}>
          <h2 className="flex items-center gap-2 text-style-headline-sm">
            <span aria-hidden="true">🌰</span> {t('help.seedsHeading')}
          </h2>
          <p className="text-style-body-md text-text">
            <Trans
              t={t}
              i18nKey="help.seedsBody"
              values={{ focusSeeds, cycleSeeds }}
              components={[<strong key="0" />, <strong key="1" />]}
            />
          </p>
        </section>

        <section className={CARD_CLASSES}>
          <h2 className="flex items-center gap-2 text-style-headline-sm">
            <span aria-hidden="true">🔥</span> {t('help.streakHeading')}
          </h2>
          <p className="text-style-body-md text-text">{t('help.streakBody')}</p>
        </section>
      </div>

      <section className={CARD_CLASSES}>
        <h2 className="flex items-center gap-2 text-style-headline-sm">
          <span aria-hidden="true">🌻</span> {t('help.gardenHeading')}
        </h2>
        <p className="text-style-body-md text-text">
          {t('help.gardenBody', {
            species: GARDEN_SPECIES.map((species) => `${species.emoji} ${species.name}`).join(', '),
          })}
        </p>
      </section>
    </div>
  )
}
