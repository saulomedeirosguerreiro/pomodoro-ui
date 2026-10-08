import { api } from './apiClient'
import type { UserProfile } from '../types/api'

export const usersService = {
  getMe: () => api.get<UserProfile>('/api/users/me'),
  deleteAccount: (password: string) => api.delete<void>('/api/users/me', { password }),
}
