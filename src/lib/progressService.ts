import { api } from './apiClient'
import type { ProgressSummary } from '../types/api'

function resolveTimeZone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone
  } catch {
    return 'America/Sao_Paulo'
  }
}

export const progressService = {
  getMyProgress: () => api.get<ProgressSummary>(`/api/users/me/progress?tz=${encodeURIComponent(resolveTimeZone())}`),
}
