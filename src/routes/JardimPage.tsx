import { useCallback, useEffect, useMemo, useState } from 'react'
import { Button } from '../components/common/Button'
import { HistoryList } from '../components/History/HistoryList'
import { speciesForIndex } from '../lib/gardenSpecies'
import { pomodorosService } from '../lib/pomodorosService'
import type { PomodoroSession } from '../types/api'
import styles from './JardimPage.module.css'

const PAGE_SIZE = 10

export function JardimPage() {
  const [items, setItems] = useState<PomodoroSession[] | null>(null)
  const [totalCount, setTotalCount] = useState(0)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async (offset: number, append: boolean) => {
    setError(null)
    try {
      const page = await pomodorosService.list(PAGE_SIZE, offset)
      setTotalCount(page.totalCount)
      setItems((prev) => (append && prev ? [...prev, ...page.items] : page.items))
    } catch {
      setError('Não foi possível carregar o histórico.')
    }
  }, [])

  useEffect(() => {
    load(0, false)
  }, [load])

  const collection = useMemo(() => {
    const focusItemsNewestFirst = (items ?? []).filter((s) => s.type === 'foco' && s.status === 'concluido')
    // A espécie é derivada da posição do foco (mais antigo primeiro), então inverte antes de indexar.
    const oldestFirst = [...focusItemsNewestFirst].reverse()
    const counts = new Map<string, { emoji: string; count: number }>()
    oldestFirst.forEach((_, index) => {
      const species = speciesForIndex(index)
      const current = counts.get(species.name) ?? { emoji: species.emoji, count: 0 }
      counts.set(species.name, { ...current, count: current.count + 1 })
    })
    return Array.from(counts.entries()).map(([name, value]) => ({ name, ...value }))
  }, [items])

  function handleLoadMore() {
    load(items?.length ?? 0, true)
  }

  const hasMore = (items?.length ?? 0) < totalCount

  return (
    <div className={styles.page}>
      <h1>Jardim de Foco</h1>

      <section className={styles.card}>
        <h2>Minha coleção</h2>
        {collection.length === 0 ? (
          <p className={styles.empty}>Nenhuma planta colhida ainda. Conclua um foco para começar.</p>
        ) : (
          <div className={styles.grid}>
            {collection.map((species) => (
              <div key={species.name} className={styles.species}>
                <span className={styles.speciesEmoji} aria-hidden="true">
                  {species.emoji}
                </span>
                <span className={styles.speciesName}>{species.name}</span>
                <span className={styles.speciesCount}>×{species.count}</span>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className={styles.card}>
        <h2>Histórico completo</h2>
        <HistoryList items={items} error={error} onRetry={() => load(0, false)} />
        {hasMore && !error && (
          <Button variant="ghost" fullWidth onClick={handleLoadMore}>
            Ver mais
          </Button>
        )}
      </section>
    </div>
  )
}
