import { Button } from '../common/Button'
import { Dialog } from '../common/Dialog'
import type { ImportGuestDataResponse } from '../../lib/migrationService'

interface MigrationReportProps {
  result: ImportGuestDataResponse
  onDismiss: () => void
}

/** Só é mostrado quando `result.skipped.length > 0` — quem não teve nenhum item problemático não vê tela nenhuma. */
export function MigrationReport({ result, onDismiss }: MigrationReportProps) {
  const importedCount = result.tasksImported + result.sessionsImported

  return (
    <Dialog titleText="Importação concluída" onDismiss={onDismiss}>
      <p className="mb-2 text-style-body-md text-text">{importedCount} itens importados.</p>
      <p className="mb-2 text-style-body-md text-text">{result.skipped.length} itens não puderam ser importados:</p>
      <ul className="m-0 mb-4 pl-4 text-style-body-sm text-text-muted">
        {result.skipped.map((item) => (
          <li key={`${item.itemType}-${item.localId}`}>
            {item.itemType === 'task' ? 'Tarefa' : 'Sessão'} — {item.reason}
          </li>
        ))}
      </ul>
      <Button onClick={onDismiss} fullWidth>
        Entendi
      </Button>
    </Dialog>
  )
}
