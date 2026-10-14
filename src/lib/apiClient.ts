import { ApiError, type ApiErrorBody, type RefreshResponse } from '../types/api'
import { tokenStorage } from './tokenStorage'

const API_URL = import.meta.env.VITE_API_URL ?? ''

/** Disparado quando uma chamada autenticada recebe 401 — o AuthContext escuta isso para deslogar (US-04 CA-004). */
export const UNAUTHORIZED_EVENT = 'pomodoro:unauthorized'

interface RequestOptions {
  auth?: boolean
}

async function rawFetch(method: string, path: string, body: unknown, auth: boolean): Promise<Response> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }

  if (auth) {
    const token = tokenStorage.get()
    if (token) {
      headers.Authorization = `Bearer ${token}`
    }
  }

  try {
    // credentials: 'include' é obrigatório para o cookie httpOnly do refresh token trafegar — tanto
    // nesta chamada quanto no /api/auth/refresh disparado pelo retry abaixo.
    return await fetch(`${API_URL}${path}`, {
      method,
      headers,
      credentials: 'include',
      body: body !== undefined ? JSON.stringify(body) : undefined,
    })
  } catch {
    throw new ApiError(0, { code: 'network_error', message: 'Não foi possível conectar à API.' })
  }
}

/**
 * Compartilhada entre chamadas 401 concorrentes: sem isso, cada uma dispararia seu próprio
 * `/api/auth/refresh`, rotacionando o cookie várias vezes e invalidando a request-irmã.
 */
let refreshPromise: Promise<boolean> | null = null

async function refreshAccessToken(): Promise<boolean> {
  refreshPromise ??= (async () => {
    try {
      const response = await rawFetch('POST', '/api/auth/refresh', undefined, false)
      if (!response.ok) {
        return false
      }
      const data = (await response.json()) as RefreshResponse
      tokenStorage.set(data.token)
      return true
    } catch {
      return false
    }
  })().finally(() => {
    refreshPromise = null
  })

  return refreshPromise
}

async function request<T>(method: string, path: string, body?: unknown, options: RequestOptions = {}): Promise<T> {
  const { auth = true } = options

  let response = await rawFetch(method, path, body, auth)

  if (response.status === 401 && auth) {
    if (await refreshAccessToken()) {
      response = await rawFetch(method, path, body, auth)
    }

    if (response.status === 401) {
      tokenStorage.clear()
      window.dispatchEvent(new Event(UNAUTHORIZED_EVENT))
    }
  }

  if (!response.ok) {
    throw new ApiError(response.status, await parseErrorBody(response))
  }

  if (response.status === 204) {
    return undefined as T
  }

  return (await response.json()) as T
}

async function parseErrorBody(response: Response): Promise<ApiErrorBody> {
  try {
    const data = (await response.json()) as { error?: ApiErrorBody }
    return data.error ?? { code: 'unknown_error', message: 'Erro desconhecido ao comunicar com o servidor.' }
  } catch {
    return { code: 'unknown_error', message: 'Erro desconhecido ao comunicar com o servidor.' }
  }
}

export const api = {
  get: <T>(path: string, options?: RequestOptions) => request<T>('GET', path, undefined, options),
  post: <T>(path: string, body?: unknown, options?: RequestOptions) => request<T>('POST', path, body, options),
  patch: <T>(path: string, body?: unknown, options?: RequestOptions) => request<T>('PATCH', path, body, options),
  delete: <T>(path: string, body?: unknown, options?: RequestOptions) => request<T>('DELETE', path, body, options),
}
