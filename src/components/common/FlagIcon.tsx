import type { ReactElement } from 'react'
import type { SupportedLanguage } from '../../lib/language'

const STRIPE_HEIGHT = 16 / 13

function BrazilFlag() {
  return (
    <svg viewBox="0 0 24 16" width="20" height="14" aria-hidden="true">
      <rect width="24" height="16" fill="#009739" />
      <polygon points="12,2 22,8 12,14 2,8" fill="#FEDD00" />
      <circle cx="12" cy="8" r="4" fill="#012169" />
    </svg>
  )
}

function UsFlag() {
  const stripes = Array.from({ length: 13 }, (_, i) => (
    <rect key={i} x="0" y={i * STRIPE_HEIGHT} width="24" height={STRIPE_HEIGHT} fill={i % 2 === 0 ? '#B22234' : '#FFFFFF'} />
  ))
  const stars = Array.from({ length: 12 }, (_, i) => {
    const col = i % 4
    const row = Math.floor(i / 4)
    return <circle key={i} cx={1.4 + col * 2.2} cy={1.4 + row * 2.4} r="0.5" fill="#FFFFFF" />
  })

  return (
    <svg viewBox="0 0 24 16" width="20" height="14" aria-hidden="true">
      {stripes}
      <rect x="0" y="0" width="9.6" height={STRIPE_HEIGHT * 7} fill="#3C3B6E" />
      {stars}
    </svg>
  )
}

function SpainFlag() {
  return (
    <svg viewBox="0 0 24 16" width="20" height="14" aria-hidden="true">
      <rect width="24" height="4" fill="#AA151B" />
      <rect width="24" height="8" y="4" fill="#F1BF00" />
      <rect width="24" height="4" y="12" fill="#AA151B" />
    </svg>
  )
}

const FLAG_COMPONENT: Record<SupportedLanguage, () => ReactElement> = {
  'pt-BR': BrazilFlag,
  'en-US': UsFlag,
  es: SpainFlag,
}

export function FlagIcon({ language }: { language: SupportedLanguage }) {
  const Flag = FLAG_COMPONENT[language]
  return (
    <span className="inline-flex shrink-0 overflow-hidden rounded-[3px] shadow-[0_0_0_1px_rgba(0,0,0,0.08)]">
      <Flag />
    </span>
  )
}
