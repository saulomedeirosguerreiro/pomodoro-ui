import type { PromoKind } from '../../lib/promos'

const ICON_BACKGROUND: Record<PromoKind, string> = {
  youtube: '#d93a3a',
  instagram: 'linear-gradient(135deg, #d93a8c, #a23ad9)',
  app: '#2a9d8f',
}

interface PromoIconProps {
  kind: PromoKind
  size?: number
}

export function PromoIcon({ kind, size = 44 }: PromoIconProps) {
  return (
    <div
      className="flex shrink-0 items-center justify-center rounded-lg text-white"
      style={{ width: size, height: size, background: ICON_BACKGROUND[kind] }}
      aria-hidden="true"
    >
      {kind === 'youtube' && (
        <svg width={size * 0.5} height={size * 0.5} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinejoin="round">
          <rect x="2" y="5" width="20" height="14" rx="4" />
          <path d="M10 9l5 3-5 3z" fill="currentColor" />
        </svg>
      )}
      {kind === 'instagram' && (
        <svg width={size * 0.5} height={size * 0.5} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="18" height="18" rx="5" />
          <circle cx="12" cy="12" r="4" />
          <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
        </svg>
      )}
      {kind === 'app' && (
        <svg width={size * 0.5} height={size * 0.5} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
          <rect x="6" y="2" width="12" height="20" rx="3" />
          <path d="M11 18h2" />
        </svg>
      )}
    </div>
  )
}
