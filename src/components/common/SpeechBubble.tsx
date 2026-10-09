import type { ReactNode } from 'react'

export function SpeechBubble({ children }: { children: ReactNode }) {
  return (
    <div className="relative max-w-[32rem] rounded-2xl border-2 border-border bg-surface px-6 py-2 shadow-card">
      <p className="text-center text-style-body-md text-text">{children}</p>
      <div className="absolute -bottom-2.5 left-1/2 h-4 w-4 -translate-x-1/2 rotate-45 border-b-2 border-r-2 border-border bg-surface" />
    </div>
  )
}
