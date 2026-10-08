import type { AmbientTrackId } from './settings'

export interface AmbientTrackMeta {
  id: AmbientTrackId
  label: string
}

/** G-Q15: 3 ambientes previstos — sem arquivo real ainda (débito documentado no README, US-64). */
export const AMBIENT_TRACKS: readonly AmbientTrackMeta[] = [
  { id: 'chuva', label: 'Chuva suave' },
  { id: 'cafeteria', label: 'Cafeteria' },
  { id: 'passaros', label: 'Pássaros' },
]

export interface LofiTrackMeta {
  title: string
}

/** Títulos provisórios — autor e licença só entram quando os arquivos reais chegarem (US-57 RN-01). */
export const LOFI_TRACKS: readonly LofiTrackMeta[] = [
  { title: 'Faixa Lo-Fi 1' },
  { title: 'Faixa Lo-Fi 2' },
  { title: 'Faixa Lo-Fi 3' },
]
