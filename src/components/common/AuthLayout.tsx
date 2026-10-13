import type { ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from './Button'
import { ThemeToggle } from './ThemeToggle'

function ChevronLeftIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M15 18l-6-6 6-6" />
    </svg>
  )
}

export function AuthLayout({ title, children }: { title: string; children: ReactNode }) {
  const navigate = useNavigate()

  return (
    <div className="flex flex-1 flex-col bg-bg-subtle">
      <header className="flex items-center justify-between px-4 py-4 lg:px-6">
        <Button variant="ghost" onClick={() => navigate('/timer')}>
          <ChevronLeftIcon /> Voltar
        </Button>
        <ThemeToggle />
      </header>

      <div className="flex flex-1 items-center justify-center px-4 py-6">
        <div className="w-full max-w-[400px] rounded-4xl border border-border bg-surface px-6 py-10 shadow-card">
          <h1 className="text-center text-[26px] font-extrabold leading-[32px] text-primary-dark">Guardião Pomodoro</h1>
          <h2 className="mb-6 text-center text-style-headline-sm text-text-muted">{title}</h2>
          {children}
        </div>
      </div>
    </div>
  )
}
