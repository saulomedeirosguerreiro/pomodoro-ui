import { createContext, useContext, useMemo, type ReactNode } from 'react'
import type { DataSource } from '../lib/dataSource'
import { makeLocalDataSource } from '../lib/localDataSource'
import { remoteDataSource } from '../lib/remoteDataSource'
import { useAuth } from './AuthContext'
import { useGuest } from './GuestContext'

export type DataSourceMode = 'none' | 'guest' | 'account'

interface DataSourceContextValue {
  /** `null` só quando `mode === 'none'` (antes da identificação, nem conta nem guest). */
  dataSource: DataSource | null
  mode: DataSourceMode
}

const DataSourceContext = createContext<DataSourceContextValue | undefined>(undefined)

/**
 * Decide local vs. remoto a partir de identidade (conta tem precedência sobre guest residual — edge
 * case: pessoa logada em conta mas ainda com `guestProfile` órfão no `localStorage` não deve usar o
 * modo local). `TimerContext`/páginas consomem só `useDataSource()`, nunca sabem se é guest ou conta.
 */
export function DataSourceProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const { guest } = useGuest()

  const dataSource = useMemo<DataSource | null>(() => {
    if (user) {
      return remoteDataSource
    }
    if (guest) {
      return makeLocalDataSource(guest.id)
    }
    return null
  }, [user, guest])

  const mode: DataSourceMode = user ? 'account' : guest ? 'guest' : 'none'

  return <DataSourceContext.Provider value={{ dataSource, mode }}>{children}</DataSourceContext.Provider>
}

export function useDataSource(): DataSourceContextValue {
  const context = useContext(DataSourceContext)
  if (!context) {
    throw new Error('useDataSource precisa ser usado dentro de um DataSourceProvider.')
  }
  return context
}
