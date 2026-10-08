import { api } from './apiClient'
import type { LoginResponse, UserSummary } from '../types/api'

export const authService = {
  register: (data: { name: string; email: string; password: string }) =>
    api.post<UserSummary>('/api/auth/register', data, { auth: false }),

  login: (data: { email: string; password: string }) =>
    api.post<LoginResponse>('/api/auth/login', data, { auth: false }),
}
