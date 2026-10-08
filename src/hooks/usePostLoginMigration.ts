import { useCallback, useState } from 'react'
import { useGuest } from '../context/GuestContext'
import { hasAnyLocalGuestData } from '../lib/localDataWipe'
import { buildImportRequestFromLocalData, migrationService, type ImportGuestDataResponse } from '../lib/migrationService'

type MigrationState =
  | { phase: 'idle' }
  | { phase: 'asking' }
  | { phase: 'importing' }
  | { phase: 'report'; result: ImportGuestDataResponse }
  | { phase: 'error'; message: string }

interface UsePostLoginMigrationResult {
  state: MigrationState
  /** Chamar depois de um login bem-sucedido: decide `'asking'` (há dados locais) ou já chama `onFinished()`. */
  offerIfNeeded: () => void
  chooseImport: () => Promise<void>
  chooseDiscard: () => void
  chooseLater: () => void
  dismissReport: () => void
}

/**
 * Decide o pós-login quando há dados locais pendentes (US-85 — login em conta JÁ EXISTENTE, diferente
 * de US-84/D9 no cadastro, que importa automático sem perguntar). `onFinished` é chamado ao final de
 * QUALQUER um dos 3 caminhos (tipicamente `navigate('/timer')`). `LoginPage` só renderiza o
 * diálogo/relatório que este hook pede, sem lógica de decisão própria.
 */
export function usePostLoginMigration(onFinished: () => void): UsePostLoginMigrationResult {
  const { guest, clearGuestData } = useGuest()
  const [state, setState] = useState<MigrationState>({ phase: 'idle' })

  const offerIfNeeded = useCallback(() => {
    if (hasAnyLocalGuestData()) {
      setState({ phase: 'asking' })
      return
    }
    onFinished()
  }, [onFinished])

  const chooseImport = useCallback(async () => {
    setState({ phase: 'importing' })
    try {
      const request = buildImportRequestFromLocalData(guest?.id ?? '')
      const result = await migrationService.importLocalData(request)
      clearGuestData()

      if (result.skipped.length > 0) {
        setState({ phase: 'report', result })
      } else {
        setState({ phase: 'idle' })
        onFinished()
      }
    } catch {
      setState({
        phase: 'error',
        message: 'Não foi possível importar seus dados agora. Tente novamente mais tarde.',
      })
    }
  }, [guest, clearGuestData, onFinished])

  const chooseDiscard = useCallback(() => {
    clearGuestData()
    setState({ phase: 'idle' })
    onFinished()
  }, [clearGuestData, onFinished])

  const chooseLater = useCallback(() => {
    setState({ phase: 'idle' })
    onFinished()
  }, [onFinished])

  const dismissReport = useCallback(() => {
    setState({ phase: 'idle' })
    onFinished()
  }, [onFinished])

  return { state, offerIfNeeded, chooseImport, chooseDiscard, chooseLater, dismissReport }
}
