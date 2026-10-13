import type { SessionStatus } from '../types/api'

const STATUS_LABELS: Record<SessionStatus, string> = {
  concluido: 'Concluído',
  interrompido: 'Interrompido',
}

export function statusLabel(status: SessionStatus): string {
  return STATUS_LABELS[status]
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
export function formatEventTimestamp(isoUtc: string): string {
  const date = new Date(isoUtc)
  if (Number.isNaN(date.getTime())) return ''

  const now = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  const time = `${pad(date.getHours())}:${pad(date.getMinutes())}`

  const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime()
  const diffDays = Math.round((startOfDay(now) - startOfDay(date)) / 86_400_000)

  if (diffDays === 0) return `Hoje · ${time}`
  if (diffDays === 1) return `Ontem · ${time}`
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

/** Pluralização PT-BR: escolhe a forma singular ou plural pelo count.
 *  Sem `plural` explícito, usa singular + "s" (regra regular). */
export function pluralize(count: number, singular: string, plural: string = `${singular}s`): string {
  return count === 1 ? singular : plural
}

/** Atalho para "<count> <palavra>" (ex.: "1 colheita", "2 colheitas"). */
export function pluralizeCount(count: number, singular: string, plural?: string): string {
  return `${count} ${pluralize(count, singular, plural)}`
}

/** Texto do badge de streak, compartilhado entre AppShell e PerfilPage. */
export function streakLabel(streakDays: number): string {
  return streakDays > 0
    ? `${pluralizeCount(streakDays, 'dia', 'dias')} ${pluralize(streakDays, 'seguido', 'seguidos')}`
    : 'Plante o 1º foco de hoje'
}
