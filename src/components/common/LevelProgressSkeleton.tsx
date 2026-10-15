import { Skeleton } from './Skeleton'

/**
 * Espelha a linha "barra de XP + contagem", compartilhada por AppShell.tsx (sidebar) e
 * PerfilPage.tsx — ambos alimentados pelo mesmo `progress` (ProgressSummary | null) do TimerContext.
 * Não inclui a linha "Nível X • título" acima dela porque cada chamador tem uma forma diferente ali
 * (PerfilPage soma um badge de streak na mesma linha, AppShell não) — quem chama monta essa parte.
 */
export function LevelProgressSkeleton() {
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1">
        <Skeleton variant="rect" className="h-2 w-full rounded-full" />
      </div>
      <Skeleton variant="text" className="w-16" />
    </div>
  )
}
