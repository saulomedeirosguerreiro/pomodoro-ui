import type { TFunction } from 'i18next'
import { useTranslation } from 'react-i18next'
import { Button } from '../common/Button'
import { Dialog } from '../common/Dialog'
import type { ImportGuestDataResponse, ImportSkippedItem } from '../../lib/migrationService'

interface MigrationReportProps {
  result: ImportGuestDataResponse
  onDismiss: () => void
}

/** Traduz os motivos técnicos de validação (vindos crus do backend, reaproveitados de
 *  `CreatePomodoroValidator`/`CreateTaskHandler`) para algo que não soe como um erro da conta —
 *  o mais comum de longe é duração fora da faixa (ex.: "Encerrar agora" poucos segundos após
 *  iniciar), o mesmo caso já explicado de forma amigável em `describeRegistrationError`. Motivos
 *  não mapeados caem no texto original do backend como fallback. As chaves são os textos crus que o
 *  backend devolve (sempre em pt-BR) — não são conteúdo traduzível em si, só o índice do mapa. */
const FRIENDLY_REASON_KEYS: Record<string, string> = {
  'Duração fora da faixa permitida para o tipo informado.': 'migration.report.friendlyReasons.durationOutOfRange',
  'Esta sessão se sobrepõe a outra já registrada.': 'migration.report.friendlyReasons.overlappingSession',
}

function friendlyReason(t: TFunction, reason: string): string {
  const key = FRIENDLY_REASON_KEYS[reason]
  return key ? t(key) : reason
}

function itemLabel(t: TFunction, itemType: ImportSkippedItem['itemType'], count: number): string {
  return itemType === 'task' ? t('migration.report.taskCount', { count }) : t('migration.report.sessionCount', { count })
}

/** Agrupa itens pulados por (tipo + motivo já traduzido) — evita repetir a mesma linha técnica
 *  3x quando, por exemplo, 3 sessões curtas demais caem no mesmo motivo. */
function groupSkipped(t: TFunction, skipped: ImportSkippedItem[]) {
  const groups = new Map<string, { itemType: ImportSkippedItem['itemType']; reason: string; count: number }>()

  for (const item of skipped) {
    const reason = friendlyReason(t, item.reason)
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
  const { t } = useTranslation('auth')
  const importedCount = result.tasksImported + result.sessionsImported
  const skippedCount = result.skipped.length
  const groups = groupSkipped(t, result.skipped)

  return (
    <Dialog titleText={t('migration.report.title')} onDismiss={onDismiss}>
      <div className="mb-4 flex items-center gap-3 rounded-lg border border-secondary bg-secondary-bg p-3">
        <span aria-hidden="true" className="shrink-0 text-[28px]">
          🌱
        </span>
        <p className="text-style-body-md text-secondary-dark">
          {importedCount === 0
            ? t('migration.report.readyNoItems')
            : t('migration.report.broughtItems', { count: importedCount })}
        </p>
      </div>

      {skippedCount > 0 && (
        <div className="mb-4 rounded-lg bg-bg-subtle p-3">
          <p className="mb-2 text-style-body-sm text-text-muted">
            {t('migration.report.skippedSummary', { count: skippedCount })}
          </p>
          <ul className="m-0 flex list-none flex-col gap-1 p-0 text-style-body-sm text-text-muted">
            {groups.map((group) => (
              <li key={`${group.itemType}-${group.reason}`}>
                {itemLabel(t, group.itemType, group.count)} — {group.reason}
              </li>
            ))}
          </ul>
        </div>
      )}

      <Button onClick={onDismiss} fullWidth>
        {t('migration.report.dismiss')}
      </Button>
    </Dialog>
  )
}
