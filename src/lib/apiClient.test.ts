import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { UNAUTHORIZED_EVENT, api } from './apiClient'
import { tokenStorage } from './tokenStorage'

function jsonResponse(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } })
}

describe('apiClient', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn())
    tokenStorage.clear()
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    localStorage.clear()
  })

  it('envia credentials: include em toda chamada, para o cookie httpOnly do refresh token trafegar', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(jsonResponse(200, { ok: true }))

    await api.get('/api/qualquer')

    expect(fetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({ credentials: 'include' }),
    )
  })

  it('em 401, tenta refresh silencioso e repete a chamada original com sucesso', async () => {
    tokenStorage.set('token-expirado')
    vi.mocked(fetch)
      .mockResolvedValueOnce(jsonResponse(401, { error: { code: 'unauthorized', message: 'expirado' } })) // chamada original
      .mockResolvedValueOnce(jsonResponse(200, { token: 'token-novo' })) // /api/auth/refresh
      .mockResolvedValueOnce(jsonResponse(200, { data: 'ok' })) // retry da chamada original

    const result = await api.get<{ data: string }>('/api/protegido')

    expect(result).toEqual({ data: 'ok' })
    expect(tokenStorage.get()).toBe('token-novo')
    expect(fetch).toHaveBeenCalledTimes(3)
    expect(vi.mocked(fetch).mock.calls[1][0]).toContain('/api/auth/refresh')
  })

  it('quando o refresh também falha, limpa a sessão e dispara UNAUTHORIZED_EVENT', async () => {
    tokenStorage.set('token-expirado')
    const listener = vi.fn()
    window.addEventListener(UNAUTHORIZED_EVENT, listener)

    vi.mocked(fetch)
      .mockResolvedValueOnce(jsonResponse(401, { error: { code: 'unauthorized', message: 'expirado' } }))
      .mockResolvedValueOnce(jsonResponse(401, { error: { code: 'unauthorized', message: 'sem refresh' } }))

    await expect(api.get('/api/protegido')).rejects.toMatchObject({ status: 401 })

    expect(tokenStorage.get()).toBeNull()
    expect(listener).toHaveBeenCalledTimes(1)

    window.removeEventListener(UNAUTHORIZED_EVENT, listener)
  })

  it('duas chamadas 401 concorrentes compartilham um único refresh', async () => {
    tokenStorage.set('token-expirado')
    vi.mocked(fetch)
      .mockResolvedValueOnce(jsonResponse(401, { error: { code: 'unauthorized', message: 'x' } })) // original #1
      .mockResolvedValueOnce(jsonResponse(401, { error: { code: 'unauthorized', message: 'x' } })) // original #2
      .mockResolvedValueOnce(jsonResponse(200, { token: 'token-novo' })) // único /api/auth/refresh
      .mockResolvedValueOnce(jsonResponse(200, { data: 'a' })) // retry #1
      .mockResolvedValueOnce(jsonResponse(200, { data: 'b' })) // retry #2

    const [a, b] = await Promise.all([api.get('/api/um'), api.get('/api/dois')])

    expect(a).toEqual({ data: 'a' })
    expect(b).toEqual({ data: 'b' })
    const refreshCalls = vi.mocked(fetch).mock.calls.filter(([url]) => String(url).includes('/api/auth/refresh'))
    expect(refreshCalls).toHaveLength(1)
  })

  it('erro de rede vira ApiError com status 0, sem quebrar o refresh', async () => {
    vi.mocked(fetch).mockRejectedValueOnce(new TypeError('network down'))

    await expect(api.get('/api/qualquer')).rejects.toMatchObject({ status: 0, code: 'network_error' })
  })
})
