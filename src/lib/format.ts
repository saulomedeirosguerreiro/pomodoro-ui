import type { TFunction } from 'i18next'
import type { SessionStatus } from '../types/api'

export function statusLabel(t: TFunction, status: SessionStatus): string {
  return t(`common:status.${status}`)
}

/** Recebe um ISO em UTC e exibe no fuso do navegador, formato dd/MM/aaaa HH:mm (L-9). */
export function formatDateTime(isoUtc: string): string {
  const date = new Date(isoUtc)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${pad(date.getDate())}/${pad(date.getMonth() + 1)}/${date.getFullYear()} ${pad(date.getHours())}:${pad(date.getMinutes())}`
}

/**
 * "Hoje · 14:32" / "Ontem · 09:10" / "12/10 · 14:32" — padrão de central de notificações (L-9).
 * Evento sem `createdAt` válido (ex.: estado antigo preservado pelo Fast Refresh em dev) não quebra
 * a tela: retorna string vazia em vez de "NaN/NaN · NaN:NaN".
 */
export function formatEventTimestamp(t: TFunction, isoUtc: string): string {
  const date = new Date(isoUtc)
  if (Number.isNaN(date.getTime())) return ''

  const now = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  const time = `${pad(date.getHours())}:${pad(date.getMinutes())}`

  const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime()
  const diffDays = Math.round((startOfDay(now) - startOfDay(date)) / 86_400_000)

  if (diffDays === 0) return `${t('common:today')} · ${time}`
  if (diffDays === 1) return `${t('common:yesterday')} · ${time}`
  return `${pad(date.getDate())}/${pad(date.getMonth() + 1)} · ${time}`
}

export function formatDurationMinutes(durationSeconds: number): string {
  const minutes = Math.round(durationSeconds / 60)
  return `${minutes} min`
}

/** "1h40m" ou "25min" — usado na pill de colheita do dia (US-43). */
export function formatHoursAndMinutes(totalSeconds: number): string {
  const totalMinutes = Math.round(totalSeconds / 60)
  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60

  return hours > 0 ? `${hours}h${String(minutes).padStart(2, '0')}m` : `${minutes}min`
}

/** Texto do badge de streak, compartilhado entre AppShell e PerfilPage. */
export function streakLabel(t: TFunction, streakDays: number): string {
  return streakDays > 0 ? t('common:streak.days', { count: streakDays }) : t('common:streak.none')
}
