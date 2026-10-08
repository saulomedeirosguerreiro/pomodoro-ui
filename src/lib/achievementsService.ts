import { api } from './apiClient'
import type { Achievement } from '../types/api'

export const achievementsService = {
  list: () => api.get<Achievement[]>('/api/achievements'),
}
