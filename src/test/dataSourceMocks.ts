import { vi } from 'vitest'
import * as DataSourceContextModule from '../context/DataSourceContext'
import type { DataSourceMode } from '../context/DataSourceContext'
import type { DataSource } from '../lib/dataSource'

/**
 * Fábrica de `DataSource` mockado — usada pelos testes de página (Frente 4) no lugar de mockar
 * `tasksService`/`pomodorosService`/`progressService`/`achievementsService` diretamente, já que as
 * páginas agora consomem só `useDataSource()`. Todos os métodos vêm como `vi.fn()` sem resolução
 * configurada; cada teste define o que precisa via `vi.mocked(dataSource.algumMetodo).mockResolvedValue(...)`.
 */
export function buildMockDataSource(overrides: Partial<DataSource> = {}): DataSource {
  return {
    createSession: vi.fn(),
    listSessions: vi.fn(),
    getTotalCompletedFocusCount: vi.fn(),
    listTasks: vi.fn(),
    createTask: vi.fn(),
    updateTask: vi.fn(),
    setTaskStatus: vi.fn(),
    removeTask: vi.fn(),
    getProgress: vi.fn(),
    listAchievements: vi.fn(),
    ...overrides,
  }
}

/**
 * Espiona `useDataSource()` para devolver o `dataSource` mockado sob o `mode` dado — base da suíte
 * parametrizada que roda as mesmas páginas em `mode: 'account'` e `mode: 'guest'` (garante que nenhuma
 * página desenvolveu uma dependência oculta de `user`/conta).
 */
export function mockUseDataSource(dataSource: DataSource, mode: DataSourceMode = 'account'): void {
  vi.spyOn(DataSourceContextModule, 'useDataSource').mockReturnValue({ dataSource, mode })
}

/** As duas identidades que toda página de domínio precisa suportar igualmente (edge: `mode: 'none'` não se aplica — nenhuma delas monta sem identidade, ver `ProtectedRoute`). */
export const DATA_SOURCE_MODES = ['account', 'guest'] as const satisfies readonly DataSourceMode[]
