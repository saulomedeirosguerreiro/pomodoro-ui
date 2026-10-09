import { useCallback, useEffect, useMemo, useState } from 'react'
import { Button } from '../components/common/Button'
import { HistoryList } from '../components/History/HistoryList'
import { useDataSource } from '../context/DataSourceContext'
import { speciesForIndex } from '../lib/gardenSpecies'
import type { PomodoroSession } from '../types/api'

const PAGE_SIZE = 10
const CARD_CLASSES = 'flex flex-col gap-2 rounded-2xl border border-border bg-surface p-4 shadow-card'

export function JardimPage() {
  const { dataSource } = useDataSource()
  const [items, setItems] = useState<PomodoroSession[] | null>(null)
  const [totalCount, setTotalCount] = useState(0)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(
    async (offset: number, append: boolean) => {
      if (!dataSource) return
      setError(null)
      try {
        const page = await dataSource.listSessions(PAGE_SIZE, offset)
        setTotalCount(page.totalCount)
        setItems((prev) => (append && prev ? [...prev, ...page.items] : page.items))
      } catch {
        setError('Não foi possível carregar o histórico.')
      }
    },
    [dataSource],
  )

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
    <div className="mx-auto flex max-w-[720px] flex-col gap-4">
      <h1>Jardim de Foco</h1>

      <section className={CARD_CLASSES}>
        <h2 className="text-style-headline-sm">Minha coleção</h2>
        {collection.length === 0 ? (
          <p className="text-style-body-sm text-text-muted">Nenhuma planta colhida ainda. Conclua um foco para começar.</p>
        ) : (
          <div className="grid grid-cols-[repeat(auto-fill,minmax(100px,1fr))] gap-2">
            {collection.map((species) => (
              <div
                key={species.name}
                className="flex flex-col items-center gap-0.5 rounded-lg border border-border bg-bg-subtle p-2 text-center"
              >
                <span className="text-[32px]" aria-hidden="true">
                  {species.emoji}
                </span>
                <span className="text-style-label-sm text-text-h">{species.name}</span>
                <span className="text-style-label-md text-secondary-dark">×{species.count}</span>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className={CARD_CLASSES}>
        <h2 className="text-style-headline-sm">Histórico completo</h2>
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
