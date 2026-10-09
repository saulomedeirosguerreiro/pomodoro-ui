import { useEffect, useRef, useState } from 'react'
import type { Promo } from '../lib/promos'

export interface PromoDot {
  index: number
  isActive: boolean
  ariaLabel: string
  select: () => void
}

interface UsePromoRotationResult {
  current: Promo
  index: number
  dots: PromoDot[]
}

/**
 * Alterna `items` a cada `intervalSeconds`; escolher um dot reinicia a contagem.
 *
 * O timer depende só de `intervalSeconds` e `resetKey` (nunca de `index`): se dependesse de `index`,
 * o próprio avanço automático recriaria o `setInterval` a cada troca, e qualquer HMR/remount no meio
 * do caminho (ex.: editando este arquivo com o app aberto) deixava fácil sobrepor timers e o card
 * parecia trocar "sozinho, sem parar".
 */
export function usePromoRotation(intervalSeconds: number, items: Promo[]): UsePromoRotationResult {
  const [index, setIndex] = useState(0)
  const [resetKey, setResetKey] = useState(0)
  const itemsRef = useRef(items)
  itemsRef.current = items

  useEffect(() => {
    const seconds = Math.max(3, intervalSeconds)
    const id = setInterval(() => {
      setIndex((prev) => (prev + 1) % itemsRef.current.length)
    }, seconds * 1000)
    return () => clearInterval(id)
  }, [intervalSeconds, resetKey])

  const safeIndex = index % items.length

  function select(i: number) {
    setIndex(i)
    setResetKey((key) => key + 1)
  }

  return {
    current: items[safeIndex],
    index: safeIndex,
    dots: items.map((_, i) => ({
      index: i,
      isActive: i === safeIndex,
      ariaLabel: `Mostrar divulgação ${i + 1}`,
      select: () => select(i),
    })),
  }
}
