import { api } from './apiClient'
import type { Achievement, PagedResult } from '../types/api'

export const achievementsService = {
  list: (limit = 10, offset = 0) =>
    api.get<PagedResult<Achievement>>(`/api/achievements?limit=${limit}&offset=${offset}`),
}
