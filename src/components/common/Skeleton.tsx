import type { CSSProperties } from 'react'

type SkeletonVariant = 'rect' | 'circle' | 'text'

interface SkeletonProps {
  variant?: SkeletonVariant
  width?: string | number
  height?: string | number
  className?: string
  /** Só para variant="text": quantas linhas empilhar — a última fica mais curta pra imitar texto real. */
  lines?: number
}

const BASE_CLASSES = 'animate-[skeletonPulse_1.6s_ease-in-out_infinite] bg-bg-subtle'

const VARIANT_CLASSES: Record<SkeletonVariant, string> = {
  rect: 'rounded-lg',
  circle: 'rounded-full',
  text: 'rounded-sm',
}

/**
 * Placeholder animado (pulse) pra conteúdo que ainda está carregando. `aria-hidden` porque é
 * puramente decorativo — quem anuncia "carregando" pra leitor de tela é o contêiner que o usa
 * (role="status"/aria-busy), não cada retângulo individual. O pulse já é neutralizado
 * automaticamente pelo mecanismo global de `[data-reduce-motion='true']` em src/index.css.
 */
export function Skeleton({ variant = 'rect', width, height, className, lines }: SkeletonProps) {
  if (variant === 'text' && lines && lines > 1) {
    return (
      <span className="flex flex-col gap-1.5" aria-hidden="true">
        {Array.from({ length: lines }, (_, index) => (
          <span
            key={index}
            className={`${BASE_CLASSES} ${VARIANT_CLASSES.text} block h-3.5 ${index === lines - 1 ? 'w-2/3' : 'w-full'}`}
          />
        ))}
      </span>
    )
  }

  const style: CSSProperties = {
    width,
    height: height ?? (variant === 'text' ? '0.875rem' : undefined),
  }

  return (
    <span
      aria-hidden="true"
      style={style}
      className={[BASE_CLASSES, VARIANT_CLASSES[variant], variant === 'text' ? 'block' : 'inline-block', className]
        .filter(Boolean)
        .join(' ')}
    />
  )
}
