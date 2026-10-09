import { useSettings } from '../context/SettingsContext'
import { formatDurationMinutes } from '../lib/format'
import { FOCUS_XP, REST_XP, SEEDS_PER_CYCLE_BONUS, SEEDS_PER_FOCUS, XP_PER_LEVEL_MULTIPLIER } from '../lib/gameConstants'
import { GARDEN_SPECIES } from '../lib/gardenSpecies'
import { FOCI_PER_LONG_BREAK, sessionDurationsSecondsFrom } from '../lib/timerLogic'

const CARD_CLASSES = 'flex flex-col gap-2 rounded-2xl border border-border bg-surface p-4 shadow-card'

export function AjudaPage() {
  const { settings } = useSettings()
  const durations = sessionDurationsSecondsFrom(
    settings.focusMinutes,
    settings.shortBreakMinutes,
    settings.longBreakMinutes,
  )

  return (
    <div className="mx-auto flex max-w-[640px] flex-col gap-4">
      <div>
        <h1>Ajuda</h1>
        <p className="text-style-body-sm text-text-muted">Como o Guardião Pomodoro funciona por baixo dos panos.</p>
      </div>

      <section className={CARD_CLASSES}>
        <h2 className="flex items-center gap-2 text-style-headline-sm">
          <span aria-hidden="true">📖</span> O Pomodoro
        </h2>
        <p className="text-style-body-md text-text">
          Cada período de <strong>Foco</strong> dura {formatDurationMinutes(durations.foco)}. Depois
          de um foco, vem uma <strong>Pausa Curta</strong> de {formatDurationMinutes(durations.descanso_curto)}
          {' '}— exceto a cada {FOCI_PER_LONG_BREAK}º foco, quando vem uma{' '}
          <strong>Pausa Longa</strong> de {formatDurationMinutes(durations.descanso_longo)}.
        </p>
      </section>

      <section className={CARD_CLASSES}>
        <h2 className="flex items-center gap-2 text-style-headline-sm">
          <span aria-hidden="true">🔁</span> Ciclo
        </h2>
        <p className="text-style-body-md text-text">
          Um ciclo completo são {FOCI_PER_LONG_BREAK} focos seguidos de uma pausa longa. O timer mostra "Ciclo N de{' '}
          {FOCI_PER_LONG_BREAK}" para você acompanhar onde está.
        </p>
      </section>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <section className={CARD_CLASSES}>
          <h2 className="flex items-center gap-2 text-style-headline-sm">
            <span aria-hidden="true">⭐</span> XP e Nível
          </h2>
          <p className="text-style-body-md text-text">
            Cada foco concluído vale <strong>{FOCUS_XP} XP</strong>; cada pausa concluída vale{' '}
            <strong>{REST_XP} XP</strong>. Sessões interrompidas não valem XP. Você sobe de nível a cada{' '}
            {XP_PER_LEVEL_MULTIPLIER} XP multiplicados pelo nível atual — por isso cada nível pede um pouco mais que o
            anterior.
          </p>
        </section>

        <section className={CARD_CLASSES}>
          <h2 className="flex items-center gap-2 text-style-headline-sm">
            <span aria-hidden="true">🌰</span> Sementes
          </h2>
          <p className="text-style-body-md text-text">
            Cada foco concluído rende <strong>{SEEDS_PER_FOCUS} sementes</strong>, e completar uma pausa longa dá um
            bônus de <strong>{SEEDS_PER_CYCLE_BONUS} sementes</strong> por fechar o ciclo.
          </p>
        </section>

        <section className={CARD_CLASSES}>
          <h2 className="flex items-center gap-2 text-style-headline-sm">
            <span aria-hidden="true">🔥</span> Streak
          </h2>
          <p className="text-style-body-md text-text">
            Sua sequência conta os dias seguidos com pelo menos um foco concluído. Ela só "quebra" quando um dia
            inteiro passa sem nenhum foco — um foco de madrugada ainda salva o dia anterior.
          </p>
        </section>
      </div>

      <section className={CARD_CLASSES}>
        <h2 className="flex items-center gap-2 text-style-headline-sm">
          <span aria-hidden="true">🌻</span> Jardim
        </h2>
        <p className="text-style-body-md text-text">
          Cada foco concluído no dia planta uma espécie no seu Jardim de Foco, em rotação:{' '}
          {GARDEN_SPECIES.map((species) => `${species.emoji} ${species.name}`).join(', ')}. A coleção completa fica
          na página Jardim, junto com o histórico de sessões.
        </p>
      </section>
    </div>
  )
}
