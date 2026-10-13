import { Button } from '../common/Button'
import { Dialog } from '../common/Dialog'
import { pluralize } from '../../lib/format'
import type { ImportGuestDataResponse, ImportSkippedItem } from '../../lib/migrationService'

interface MigrationReportProps {
  result: ImportGuestDataResponse
  onDismiss: () => void
}

/** Traduz os motivos técnicos de validação (vindos crus do backend, reaproveitados de
 *  `CreatePomodoroValidator`/`CreateTaskHandler`) para algo que não soe como um erro da conta —
 *  o mais comum de longe é duração fora da faixa (ex.: "Encerrar agora" poucos segundos após
 *  iniciar), o mesmo caso já explicado de forma amigável em `describeRegistrationError`. Motivos
 *  não mapeados caem no texto original do backend como fallback. */
const FRIENDLY_REASONS: Record<string, string> = {
  'Duração fora da faixa permitida para o tipo informado.':
    'duração muito curta ou muito longa pra esse tipo de sessão — não é um erro, só não entra no histórico',
  'Esta sessão se sobrepõe a outra já registrada.': 'período sobreposto a uma sessão já registrada',
}

function friendlyReason(reason: string): string {
  return FRIENDLY_REASONS[reason] ?? reason
}

function itemLabel(itemType: ImportSkippedItem['itemType'], count: number): string {
  return itemType === 'task' ? pluralize(count, 'tarefa') : pluralize(count, 'sessão', 'sessões')
}

/** Agrupa itens pulados por (tipo + motivo já traduzido) — evita repetir a mesma linha técnica
 *  3x quando, por exemplo, 3 sessões curtas demais caem no mesmo motivo. */
function groupSkipped(skipped: ImportSkippedItem[]) {
  const groups = new Map<string, { itemType: ImportSkippedItem['itemType']; reason: string; count: number }>()

  for (const item of skipped) {
    const reason = friendlyReason(item.reason)
    const key = `${item.itemType}-${reason}`
    const existing = groups.get(key)
    if (existing) {
      existing.count += 1
    } else {
      groups.set(key, { itemType: item.itemType, reason, count: 1 })
    }
  }

  return [...groups.values()]
}

/** Só é mostrado quando `result.skipped.length > 0` — quem não teve nenhum item problemático não vê tela nenhuma. */
export function MigrationReport({ result, onDismiss }: MigrationReportProps) {
  const importedCount = result.tasksImported + result.sessionsImported
  const skippedCount = result.skipped.length
  const groups = groupSkipped(result.skipped)

  return (
    <Dialog titleText="Conta criada! 🎉" onDismiss={onDismiss}>
      <div className="mb-4 flex items-center gap-3 rounded-lg border border-secondary bg-secondary-bg p-3">
        <span aria-hidden="true" className="shrink-0 text-[28px]">
          🌱
        </span>
        <p className="text-style-body-md text-secondary-dark">
          {importedCount === 0
            ? 'Sua conta está pronta — é só começar a plantar foco.'
            : `Trouxemos ${importedCount} ${pluralize(importedCount, 'item', 'itens')} que você já tinha neste navegador.`}
        </p>
      </div>

      {skippedCount > 0 && (
        <div className="mb-4 rounded-lg bg-bg-subtle p-3">
          <p className="mb-2 text-style-body-sm text-text-muted">
            {`Só ${skippedCount} ${pluralize(skippedCount, 'item', 'itens')} ${pluralize(skippedCount, 'ficou', 'ficaram')} de fora:`}
          </p>
          <ul className="m-0 flex list-none flex-col gap-1 p-0 text-style-body-sm text-text-muted">
            {groups.map((group) => (
              <li key={`${group.itemType}-${group.reason}`}>
                {group.count} {itemLabel(group.itemType, group.count)} — {group.reason}
              </li>
            ))}
          </ul>
        </div>
      )}

      <Button onClick={onDismiss} fullWidth>
        Entendi
      </Button>
    </Dialog>
  )
}
