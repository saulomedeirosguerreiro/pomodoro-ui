import { useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { AchievementRowSkeleton } from '../components/Achievements/AchievementRowSkeleton'
import { Button } from '../components/common/Button'
import { ProgressBar } from '../components/common/ProgressBar'
import { useDataSource } from '../context/DataSourceContext'
import { formatDateTime } from '../lib/format'
import type { Achievement } from '../types/api'

const PAGE_SIZE = 10
const CARD_CLASSES = 'flex flex-col gap-2 rounded-2xl border border-border bg-surface p-4 shadow-card'

export function ConquistasPage() {
  const { t } = useTranslation('achievements')
  const { dataSource } = useDataSource()
  const [achievements, setAchievements] = useState<Achievement[] | null>(null)
  const [totalCount, setTotalCount] = useState(0)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(
    async (offset: number, append: boolean) => {
      if (!dataSource) return
      try {
        const page = await dataSource.listAchievements(PAGE_SIZE, offset)
        setError(null)
        setTotalCount(page.totalCount)
        setAchievements((prev) => (append && prev ? [...prev, ...page.items] : page.items))
      } catch {
        setError(t('page.error'))
      }
    },
    [dataSource, t],
  )

  useEffect(() => {
    load(0, false)
  }, [load])

  function handleLoadMore() {
    load(achievements?.length ?? 0, true)
  }

  const hasMore = (achievements?.length ?? 0) < totalCount
  const unlocked = (achievements ?? []).filter((a) => a.unlockedAt)
  const locked = (achievements ?? []).filter((a) => !a.unlockedAt)

  return (
    <div className="mx-auto flex max-w-[720px] flex-col gap-4">
      <h1>{t('page.title')}</h1>

      {error && <p className="text-style-body-sm text-danger">{error}</p>}

      <section className={CARD_CLASSES}>
        <h2 className="text-style-headline-sm">{t('page.lockedTitle')}</h2>
        {achievements === null ? (
          <ul className="flex list-none flex-col gap-2 m-0 p-0" role="status" aria-live="polite" aria-busy="true">
            <span className="sr-only">{t('page.loading')}</span>
            {Array.from({ length: 2 }, (_, index) => (
              <AchievementRowSkeleton key={index} locked />
            ))}
          </ul>
        ) : locked.length === 0 ? (
          <p className="text-style-body-sm text-text-muted">{t('page.lockedEmpty')}</p>
        ) : (
          <ul className="flex list-none flex-col gap-2 m-0 p-0">
            {locked.map((achievement) => (
              <li key={achievement.code} className="flex gap-2 rounded-lg border border-border bg-bg-subtle p-2">
                <span className="shrink-0 text-[28px]" aria-hidden="true">
                  🔒
                </span>
                <div className="flex flex-1 flex-col gap-0.5">
                  <p className="text-style-label-md text-text-h">{t(`catalog.${achievement.code}.name`)}</p>
                  <p className="text-style-body-sm text-text-muted">{t(`catalog.${achievement.code}.description`)}</p>
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
        {hasMore && !error && (
          <Button variant="ghost" fullWidth onClick={handleLoadMore}>
            {t('page.loadMore')}
          </Button>
        )}
      </section>

      <section className={CARD_CLASSES}>
        <h2 className="text-style-headline-sm">{t('page.unlockedTitle')}</h2>
        {achievements === null ? (
          <ul className="flex list-none flex-col gap-2 m-0 p-0" role="status" aria-live="polite" aria-busy="true">
            <span className="sr-only">{t('page.loading')}</span>
            {Array.from({ length: 2 }, (_, index) => (
              <AchievementRowSkeleton key={index} />
            ))}
          </ul>
        ) : unlocked.length === 0 ? (
          <p className="text-style-body-sm text-text-muted">{t('page.unlockedEmpty')}</p>
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
                  <p className="text-style-label-md text-text-h">{t(`catalog.${achievement.code}.name`)}</p>
                  <p className="text-style-body-sm text-text-muted">{t(`catalog.${achievement.code}.description`)}</p>
                  <p className="text-style-label-sm text-secondary-dark">
                    {t('page.unlockedAt', { date: formatDateTime(achievement.unlockedAt!) })}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
