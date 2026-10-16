export type PromoKind = 'youtube' | 'app' | 'instagram'

export interface Promo {
  id: string
  kind: PromoKind
  url: string
}

export const PROMOS: Promo[] = [
  { id: 'budai-app', kind: 'app', url: 'https://getbudai.com/' },
  { id: 'cla-da-grana', kind: 'youtube', url: 'https://www.youtube.com/@ClaDaGrana' },
  { id: 'budai-instagram', kind: 'instagram', url: 'https://www.instagram.com/getbudai/' },
]
