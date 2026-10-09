import type { ReactNode } from 'react'
import { ThemeToggle } from './ThemeToggle'

export function AuthLayout({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="relative flex flex-1 items-center justify-center bg-bg-subtle px-4 py-6">
      <div className="absolute right-6 top-6">
        <ThemeToggle />
      </div>
      <div className="w-full max-w-[400px] rounded-4xl border border-border bg-surface px-6 py-10 shadow-card">
        <h1 className="text-center text-style-headline-xl text-primary-dark">Pomodoro</h1>
        <h2 className="mb-6 text-center text-style-headline-sm text-text-muted">{title}</h2>
        {children}
      </div>
    </div>
  )
}
