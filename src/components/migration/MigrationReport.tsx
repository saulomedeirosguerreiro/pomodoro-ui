import { Button } from '../common/Button'
import { Dialog } from '../common/Dialog'
import type { ImportGuestDataResponse } from '../../lib/migrationService'
import styles from './MigrationReport.module.css'

interface MigrationReportProps {
  result: ImportGuestDataResponse
  onDismiss: () => void
}

/** Só é mostrado quando `result.skipped.length > 0` — quem não teve nenhum item problemático não vê tela nenhuma. */
export function MigrationReport({ result, onDismiss }: MigrationReportProps) {
  const importedCount = result.tasksImported + result.sessionsImported

  return (
    <Dialog titleText="Importação concluída" onDismiss={onDismiss}>
      <p className={styles.summary}>{importedCount} itens importados.</p>
      <p className={styles.summary}>{result.skipped.length} itens não puderam ser importados:</p>
      <ul className={styles.list}>
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
