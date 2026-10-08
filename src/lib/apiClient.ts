import { ApiError, type ApiErrorBody } from '../types/api'
import { tokenStorage } from './tokenStorage'

const API_URL = import.meta.env.VITE_API_URL ?? ''

/** Disparado quando uma chamada autenticada recebe 401 — o AuthContext escuta isso para deslogar (US-04 CA-004). */
export const UNAUTHORIZED_EVENT = 'pomodoro:unauthorized'

interface RequestOptions {
  auth?: boolean
}

async function request<T>(method: string, path: string, body?: unknown, options: RequestOptions = {}): Promise<T> {
  const { auth = true } = options
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }

  if (auth) {
    const token = tokenStorage.get()
    if (token) {
      headers.Authorization = `Bearer ${token}`
    }
  }

  let response: Response
  try {
    response = await fetch(`${API_URL}${path}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    })
  } catch {
    throw new ApiError(0, { code: 'network_error', message: 'Não foi possível conectar à API.' })
  }

  if (response.status === 401 && auth) {
    tokenStorage.clear()
    window.dispatchEvent(new Event(UNAUTHORIZED_EVENT))
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
  delete: <T>(path: string, options?: RequestOptions) => request<T>('DELETE', path, undefined, options),
}
