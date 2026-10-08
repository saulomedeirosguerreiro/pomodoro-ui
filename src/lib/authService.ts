import { api } from './apiClient'
import type { LoginResponse, UserSummary } from '../types/api'

export const authService = {
  register: (data: { name: string; email: string; password: string }) =>
    api.post<UserSummary>('/api/auth/register', data, { auth: false }),

  login: (data: { email: string; password: string }) =>
    api.post<LoginResponse>('/api/auth/login', data, { auth: false }),

  /**
   * `POST /api/auth/password-recovery` — sem e-mail/token (risco aceito, decisão de produto): só troca
   * a senha se `name` e `email` baterem com uma conta existente. Retorna `204 No Content`; `404` com
   * mensagem genérica se os dados não baterem; `429` se exceder o rate limit (`RateLimitPolicies.PasswordRecovery`).
   */
  recoverPassword: (data: { name: string; email: string; newPassword: string }) =>
    api.post<void>('/api/auth/password-recovery', data, { auth: false }),
}
