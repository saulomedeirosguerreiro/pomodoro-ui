import { useCallback, useEffect, useState } from 'react'
import { ProgressBar } from '../components/common/ProgressBar'
import { achievementsService } from '../lib/achievementsService'
import { formatDateTime } from '../lib/format'
import type { Achievement } from '../types/api'
import styles from './ConquistasPage.module.css'

export function ConquistasPage() {
  const [achievements, setAchievements] = useState<Achievement[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    try {
      const items = await achievementsService.list()
      setError(null)
      setAchievements(items)
    } catch {
      setError('Não foi possível carregar as conquistas.')
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const unlocked = (achievements ?? []).filter((a) => a.unlockedAt)
  const locked = (achievements ?? []).filter((a) => !a.unlockedAt)

  return (
    <div className={styles.page}>
      <h1>Conquistas</h1>

      {error && <p className={styles.error}>{error}</p>}

      <section className={styles.card}>
        <h2>Desbloqueadas</h2>
        {unlocked.length === 0 ? (
          <p className={styles.empty}>Continue focando — sua primeira conquista está logo ali.</p>
        ) : (
          <ul className={styles.list}>
            {unlocked.map((achievement) => (
              <li key={achievement.code} className={`${styles.item} ${styles.unlocked}`}>
                <span className={styles.icon} aria-hidden="true">
                  🏆
                </span>
                <div className={styles.itemBody}>
                  <p className={styles.name}>{achievement.name}</p>
                  <p className={styles.description}>{achievement.description}</p>
                  <p className={styles.date}>Desbloqueada em {formatDateTime(achievement.unlockedAt!)}</p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className={styles.card}>
        <h2>Em progresso</h2>
        {locked.length === 0 ? (
          <p className={styles.empty}>Você desbloqueou todas as conquistas disponíveis!</p>
        ) : (
          <ul className={styles.list}>
            {locked.map((achievement) => (
              <li key={achievement.code} className={styles.item}>
                <span className={styles.icon} aria-hidden="true">
                  🔒
                </span>
                <div className={styles.itemBody}>
                  <p className={styles.name}>{achievement.name}</p>
                  <p className={styles.description}>{achievement.description}</p>
                  {achievement.progressCurrent !== null && achievement.progressTarget !== null && (
                    <>
                      <ProgressBar value={achievement.progressCurrent} max={achievement.progressTarget} />
                      <p className={styles.progressLabel}>
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
