export type PromoKind = 'youtube' | 'app' | 'instagram'

export interface Promo {
  id: string
  kind: PromoKind
  label: string
  title: string
  description: string
  cta: string
  url: string
}

export const PROMOS: Promo[] = [
  {
    id: 'budai-app',
    kind: 'app',
    label: 'App',
    title: 'BudAI',
    description: 'Organize suas finanças pessoais sem esforço',
    cta: 'Conhecer o BudAI',
    url: 'https://getbudai.com/',
  },
  {
    id: 'cla-da-grana',
    kind: 'youtube',
    label: 'Canal no YouTube',
    title: 'Clã da Grana',
    description: 'Vídeos sobre dinheiro e investimentos',
    cta: 'Inscrever-se no canal',
    url: 'https://www.youtube.com/@ClaDaGrana',
  },
  {
    id: 'budai-instagram',
    kind: 'instagram',
    label: 'Instagram',
    title: 'BudAI no Instagram',
    description: 'Dicas de finanças no feed e nos stories',
    cta: 'Seguir no Instagram',
    url: 'https://www.instagram.com/getbudai/',
  },
]
