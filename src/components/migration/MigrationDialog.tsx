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
  return (
    <Dialog titleText="Você tem dados salvos neste navegador" dismissible={!isImporting} onDismiss={onLater}>
      <p className="mb-4 text-style-body-md text-text">
        Encontramos tarefas e sessões registradas sem conta. O que você quer fazer com elas?
      </p>
      <div className="flex flex-col gap-2">
        <Button onClick={onImport} disabled={isImporting} fullWidth>
          {isImporting ? 'Levando para a conta…' : 'Levar para minha conta'}
        </Button>
        <Button variant="secondary" onClick={onDiscard} disabled={isImporting} fullWidth>
          Descartar (não pode ser desfeito)
        </Button>
        <Button variant="ghost" onClick={onLater} disabled={isImporting} fullWidth>
          Agora não (decidir depois)
        </Button>
      </div>
    </Dialog>
  )
}
