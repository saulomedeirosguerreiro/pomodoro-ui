import { useTranslation } from 'react-i18next'
import { Button } from '../common/Button'
import { Dialog } from '../common/Dialog'

interface MigrationDialogProps {
  onImport: () => void
  onDiscard: () => void
  onLater: () => void
  isImporting: boolean
}

/**
 * Diálogo de 3 opções do login em conta já existente com dados locais pendentes (US-85/D9) —
 * "Levar" e "Agora não" são adiáveis/reversíveis em espírito, "Descartar" é destrutivo, por isso o
 * texto de cada botão deixa isso explícito.
 */
export function MigrationDialog({ onImport, onDiscard, onLater, isImporting }: MigrationDialogProps) {
  const { t } = useTranslation('auth')

  return (
    <Dialog titleText={t('migration.dialog.title')} dismissible={!isImporting} onDismiss={onLater}>
      <p className="mb-4 text-style-body-md text-text">{t('migration.dialog.body')}</p>
      <div className="flex flex-col gap-2">
        <Button onClick={onImport} disabled={isImporting} fullWidth>
          {isImporting ? t('migration.dialog.importing') : t('migration.dialog.import')}
        </Button>
        <Button variant="secondary" onClick={onDiscard} disabled={isImporting} fullWidth>
          {t('migration.dialog.discard')}
        </Button>
        <Button variant="ghost" onClick={onLater} disabled={isImporting} fullWidth>
          {t('migration.dialog.later')}
        </Button>
      </div>
    </Dialog>
  )
}
