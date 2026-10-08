import { act, renderHook, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import * as GuestContext from '../context/GuestContext'
import { hasAnyLocalGuestData, wipeAllLocalGuestData } from '../lib/localDataWipe'
import { migrationService } from '../lib/migrationService'
import type { ImportGuestDataResponse } from '../lib/migrationService'
import { usePostLoginMigration } from './usePostLoginMigration'

vi.mock('../lib/localDataWipe', () => ({
  hasAnyLocalGuestData: vi.fn(),
  wipeAllLocalGuestData: vi.fn(),
}))

vi.mock('../lib/migrationService', () => ({
  migrationService: { importLocalData: vi.fn() },
  buildImportRequestFromLocalData: vi.fn(() => ({ guestId: 'guest-1', tasks: [], sessions: [] })),
}))

function mockGuest() {
  vi.spyOn(GuestContext, 'useGuest').mockReturnValue({
    guest: { id: 'guest-1', name: 'Visitante', createdAt: '2026-01-01T00:00:00Z' },
    isLoading: false,
    startGuest: vi.fn(),
    clearGuestData: vi.fn(),
  })
}

function buildResponse(skipped: ImportGuestDataResponse['skipped'] = []): ImportGuestDataResponse {
  return {
    importId: 1,
    guestId: 'guest-1',
    importedAt: '2026-01-01T00:00:00Z',
    tasksImported: 2,
    sessionsImported: 3,
    achievementsUnlocked: [],
    skipped,
  }
}

describe('usePostLoginMigration', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGuest()
  })

  it('offerIfNeeded sem dados locais chama onFinished direto, sem perguntar', () => {
    vi.mocked(hasAnyLocalGuestData).mockReturnValue(false)
    const onFinished = vi.fn()
    const { result } = renderHook(() => usePostLoginMigration(onFinished))

    act(() => result.current.offerIfNeeded())

    expect(onFinished).toHaveBeenCalledTimes(1)
    expect(result.current.state).toEqual({ phase: 'idle' })
  })

  it('offerIfNeeded com dados locais entra em "asking", sem chamar onFinished ainda', () => {
    vi.mocked(hasAnyLocalGuestData).mockReturnValue(true)
    const onFinished = vi.fn()
    const { result } = renderHook(() => usePostLoginMigration(onFinished))

    act(() => result.current.offerIfNeeded())

    expect(onFinished).not.toHaveBeenCalled()
    expect(result.current.state).toEqual({ phase: 'asking' })
  })

  it('chooseImport sem itens pulados: importa, limpa o local e chama onFinished sem mostrar relatório', async () => {
    vi.mocked(migrationService.importLocalData).mockResolvedValue(buildResponse([]))
    const onFinished = vi.fn()
    const { result } = renderHook(() => usePostLoginMigration(onFinished))

    await act(() => result.current.chooseImport())

    expect(migrationService.importLocalData).toHaveBeenCalledWith({ guestId: 'guest-1', tasks: [], sessions: [] })
    expect(wipeAllLocalGuestData).toHaveBeenCalledTimes(1)
    expect(onFinished).toHaveBeenCalledTimes(1)
    expect(result.current.state).toEqual({ phase: 'idle' })
  })

  it('chooseImport com itens pulados: mostra o relatório e NÃO chama onFinished ainda', async () => {
    const response = buildResponse([{ itemType: 'task', localId: '7', reason: 'Dados inválidos.' }])
    vi.mocked(migrationService.importLocalData).mockResolvedValue(response)
    const onFinished = vi.fn()
    const { result } = renderHook(() => usePostLoginMigration(onFinished))

    await act(() => result.current.chooseImport())

    expect(wipeAllLocalGuestData).toHaveBeenCalledTimes(1)
    expect(onFinished).not.toHaveBeenCalled()
    expect(result.current.state).toEqual({ phase: 'report', result: response })
  })

  it('chooseImport com falha de rede entra em "error", sem limpar o local nem chamar onFinished', async () => {
    vi.mocked(migrationService.importLocalData).mockRejectedValue(new Error('network'))
    const onFinished = vi.fn()
    const { result } = renderHook(() => usePostLoginMigration(onFinished))

    await act(() => result.current.chooseImport())

    await waitFor(() => expect(result.current.state.phase).toBe('error'))
    expect(wipeAllLocalGuestData).not.toHaveBeenCalled()
    expect(onFinished).not.toHaveBeenCalled()
  })

  it('chooseDiscard limpa o local e chama onFinished', () => {
    const onFinished = vi.fn()
    const { result } = renderHook(() => usePostLoginMigration(onFinished))

    act(() => result.current.chooseDiscard())

    expect(wipeAllLocalGuestData).toHaveBeenCalledTimes(1)
    expect(onFinished).toHaveBeenCalledTimes(1)
    expect(result.current.state).toEqual({ phase: 'idle' })
  })

  it('chooseLater chama onFinished SEM tocar no localStorage', () => {
    const onFinished = vi.fn()
    const { result } = renderHook(() => usePostLoginMigration(onFinished))

    act(() => result.current.chooseLater())

    expect(wipeAllLocalGuestData).not.toHaveBeenCalled()
    expect(onFinished).toHaveBeenCalledTimes(1)
    expect(result.current.state).toEqual({ phase: 'idle' })
  })

  it('dismissReport fecha o relatório e chama onFinished', async () => {
    const response = buildResponse([{ itemType: 'session', localId: '9', reason: 'Sobreposição.' }])
    vi.mocked(migrationService.importLocalData).mockResolvedValue(response)
    const onFinished = vi.fn()
    const { result } = renderHook(() => usePostLoginMigration(onFinished))

    await act(() => result.current.chooseImport())
    act(() => result.current.dismissReport())

    expect(onFinished).toHaveBeenCalledTimes(1)
    expect(result.current.state).toEqual({ phase: 'idle' })
  })
})
