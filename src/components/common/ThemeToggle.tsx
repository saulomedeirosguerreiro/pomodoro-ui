import { useTheme } from '../../context/ThemeContext'

function SunIcon({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
    </svg>
  )
}

function MoonIcon({ className }: { className?: string }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M20.742 13.045a8.088 8.088 0 0 1-2.077.271c-4.49 0-8.132-3.642-8.132-8.132 0-.712.092-1.403.265-2.062a.75.75 0 0 0-.967-.902A10.12 10.12 0 0 0 3 11.835C3 17.455 7.546 22 13.165 22a10.12 10.12 0 0 0 9.615-6.891.75.75 0 0 0-.902-.967 8.1 8.1 0 0 1-1.136.903z" />
    </svg>
  )
}

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme()
  const isDark = theme === 'dark'

  return (
    <button
      type="button"
      role="switch"
      aria-checked={isDark}
      onClick={toggleTheme}
      aria-label={isDark ? 'Mudar para tema claro' : 'Mudar para tema escuro'}
      title={isDark ? 'Mudar para tema claro' : 'Mudar para tema escuro'}
      className={`relative inline-flex h-8 w-14 shrink-0 cursor-pointer items-center rounded-full border p-1 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-border ${
        isDark ? 'border-primary-border bg-primary-bg' : 'border-border bg-bg-subtle'
      }`}
    >
      <SunIcon
        className={`pointer-events-none absolute left-1.5 h-4 w-4 ${isDark ? 'text-text-muted' : 'text-primary-dark'}`}
      />
      <MoonIcon
        className={`pointer-events-none absolute right-1.5 h-4 w-4 ${isDark ? 'text-primary-dark' : 'text-text-muted'}`}
      />
      <span
        aria-hidden="true"
        className={`relative inline-flex h-5 w-5 items-center justify-center rounded-full border border-border bg-surface text-primary shadow-card transition-transform duration-200 ${
          isDark ? 'translate-x-[26px]' : 'translate-x-0'
        }`}
      >
        {isDark ? <MoonIcon className="h-3 w-3" /> : <SunIcon className="h-3 w-3" />}
      </span>
    </button>
  )
}
