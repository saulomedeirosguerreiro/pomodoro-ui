import { useCallback, useEffect, useState } from 'react'
import { ProgressBar } from '../components/common/ProgressBar'
import { useDataSource } from '../context/DataSourceContext'
import { formatDateTime } from '../lib/format'
import type { Achievement } from '../types/api'

const CARD_CLASSES = 'flex flex-col gap-2 rounded-2xl border border-border bg-surface p-4 shadow-card'

export function ConquistasPage() {
  const { dataSource } = useDataSource()
  const [achievements, setAchievements] = useState<Achievement[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!dataSource) return
    try {
      const items = await dataSource.listAchievements()
      setError(null)
      setAchievements(items)
    } catch {
      setError('Não foi possível carregar as conquistas.')
    }
  }, [dataSource])

  useEffect(() => {
    load()
  }, [load])

  const unlocked = (achievements ?? []).filter((a) => a.unlockedAt)
  const locked = (achievements ?? []).filter((a) => !a.unlockedAt)

  return (
    <div className="mx-auto flex max-w-[720px] flex-col gap-4">
      <h1>Conquistas</h1>

      {error && <p className="text-style-body-sm text-danger">{error}</p>}

      <section className={CARD_CLASSES}>
        <h2 className="text-style-headline-sm">Desbloqueadas</h2>
        {unlocked.length === 0 ? (
          <p className="text-style-body-sm text-text-muted">Continue focando — sua primeira conquista está logo ali.</p>
        ) : (
          <ul className="flex list-none flex-col gap-2 m-0 p-0">
            {unlocked.map((achievement) => (
              <li
                key={achievement.code}
                className="flex gap-2 rounded-lg border border-tertiary bg-bg-subtle p-2"
              >
                <span className="shrink-0 text-[28px]" aria-hidden="true">
                  🏆
                </span>
                <div className="flex flex-1 flex-col gap-0.5">
                  <p className="text-style-label-md text-text-h">{achievement.name}</p>
                  <p className="text-style-body-sm text-text-muted">{achievement.description}</p>
                  <p className="text-style-label-sm text-secondary-dark">
                    Desbloqueada em {formatDateTime(achievement.unlockedAt!)}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className={CARD_CLASSES}>
        <h2 className="text-style-headline-sm">Em progresso</h2>
        {locked.length === 0 ? (
          <p className="text-style-body-sm text-text-muted">Você desbloqueou todas as conquistas disponíveis!</p>
        ) : (
          <ul className="flex list-none flex-col gap-2 m-0 p-0">
            {locked.map((achievement) => (
              <li key={achievement.code} className="flex gap-2 rounded-lg border border-border bg-bg-subtle p-2">
                <span className="shrink-0 text-[28px]" aria-hidden="true">
                  🔒
                </span>
                <div className="flex flex-1 flex-col gap-0.5">
                  <p className="text-style-label-md text-text-h">{achievement.name}</p>
                  <p className="text-style-body-sm text-text-muted">{achievement.description}</p>
                  {achievement.progressCurrent !== null && achievement.progressTarget !== null && (
                    <>
                      <ProgressBar value={achievement.progressCurrent} max={achievement.progressTarget} />
                      <p className="text-style-label-sm text-text-muted">
                        {achievement.progressCurrent}/{achievement.progressTarget}
                      </p>
                    </>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
