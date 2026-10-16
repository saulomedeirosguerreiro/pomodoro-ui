import type { TFunction } from 'i18next'
import { ApiError, type ApiErrorBody, type RefreshResponse } from '../types/api'
import { tokenStorage } from './tokenStorage'

const API_URL = import.meta.env.VITE_API_URL ?? ''

/**
 * Sem isso, um backend que nunca responde (ex.: cold start travado num provedor free tier, DNS/CORS
 * preso, conexão caída no meio) deixava o `fetch` pendurado indefinidamente — e com ele `AuthContext`
 * (`isLoading` só vira `false` no `.finally` de `refreshProfile()`), travando `ProtectedRoute`/
 * `PublicOnlyRoute` (que não renderizam nada enquanto `isLoading`) numa tela em branco pra sempre.
 * Abortar depois de um tempo faz a chamada falhar como `network_error` de verdade, o fluxo de
 * guest/login assume e a pessoa consegue usar o app em vez de ficar olhando a cor de fundo.
 */
const REQUEST_TIMEOUT_MS = 20_000

/** Disparado quando uma chamada autenticada recebe 401 — o AuthContext escuta isso para deslogar (US-04 CA-004). */
export const UNAUTHORIZED_EVENT = 'pomodoro:unauthorized'

/**
 * Disparado quando qualquer chamada (autenticada ou não) volta com 5xx — "nosso backend caiu de
 * verdade", diferente de `network_error` (sem internet/DNS/timeout, tratado como guest/offline pelo
 * AuthContext). O gate em App.tsx escuta isso pra sobrepor a ServiceUnavailableScreen.
 */
export const SERVER_ERROR_EVENT = 'pomodoro:server_error'

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

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)

  try {
    // credentials: 'include' é obrigatório para o cookie httpOnly do refresh token trafegar — tanto
    // nesta chamada quanto no /api/auth/refresh disparado pelo retry abaixo.
    return await fetch(`${API_URL}${path}`, {
      method,
      headers,
      credentials: 'include',
      body: body !== undefined ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    })
  } catch {
    // Mesmo tratamento pra falha de rede de verdade e pro abort por timeout — pra quem usa o app as
    // duas são a mesma coisa ("não deu pra falar com o servidor"), e o código `network_error` já é o
    // único traduzido de propósito em `apiErrorMessage` (ver `lib/format.ts`/rotas de auth).
    throw new ApiError(0, { code: 'network_error', message: 'Não foi possível conectar à API.' })
  } finally {
    clearTimeout(timeoutId)
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
    if (response.status >= 500) {
      window.dispatchEvent(new Event(SERVER_ERROR_EVENT))
    }
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

/**
 * `err.message` vem do backend (ainda só em pt-BR, fora do escopo desta migração) — mas
 * `network_error` é gerado aqui mesmo, no `rawFetch` (falha de `fetch`, ex.: sem internet/DNS/CORS),
 * então é o único código de erro de API que este frontend consegue, de fato, traduzir.
 */
export function apiErrorMessage(t: TFunction, err: ApiError): string {
  return err.code === 'network_error' ? t('common:networkError') : err.message
}

export const api = {
  get: <T>(path: string, options?: RequestOptions) => request<T>('GET', path, undefined, options),
  post: <T>(path: string, body?: unknown, options?: RequestOptions) => request<T>('POST', path, body, options),
  patch: <T>(path: string, body?: unknown, options?: RequestOptions) => request<T>('PATCH', path, body, options),
  delete: <T>(path: string, body?: unknown, options?: RequestOptions) => request<T>('DELETE', path, body, options),
}
