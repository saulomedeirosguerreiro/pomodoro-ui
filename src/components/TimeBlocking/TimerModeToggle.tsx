import type { ReactNode } from 'react'

export type TimerMode = 'classico' | 'flexivel'

interface TimerModeToggleProps {
  value: TimerMode
  onChange: (mode: TimerMode) => void
  /** `true` enquanto a sessão do modo atual está em andamento (rodando OU pausada) — o outro modo trava. */
  isLocked?: boolean
}

const LOCK_TOOLTIP_TEXT =
  'Modo travado enquanto a sessão está rodando, no foco ou na pausa, para não perder seu ciclo. Encerre a sessão para trocar.'

interface ModeOption {
  value: TimerMode
  title: string
  description: string
  icon: ReactNode
}

function ClockIcon() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
      <circle cx="12" cy="13" r="8" />
      <path d="M12 9v4l2.5 2.5M9 2h6" />
    </svg>
  )
}

function SlidersIcon() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
      <path d="M4 6h10M17 6h3M4 12h3M9 12h11M4 18h13M20 18h0" />
      <circle cx="14" cy="6" r="2" fill="currentColor" stroke="none" />
      <circle cx="6" cy="12" r="2" fill="currentColor" stroke="none" />
      <circle cx="17" cy="18" r="2" fill="currentColor" stroke="none" />
    </svg>
  )
}

const OPTIONS: ModeOption[] = [
  {
    value: 'classico',
    title: 'Pomodoro Clássico',
    description: 'O jeito tradicional de cultivar foco.',
    icon: <ClockIcon />,
  },
  {
    value: 'flexivel',
    title: 'Customizado',
    description: 'Plante no seu próprio ritmo.',
    icon: <SlidersIcon />,
  },
]

/**
 * Seleção do modo de timer, como dois cards (não mais abas). Trava total durante sessão ativa: o
 * card do modo não escolhido some com o clique quando `isLocked` (sem diálogo de confirmação —
 * `aria-disabled`, nunca `disabled` nativo, porque o pedido é mostrar o tooltip também ao chegar
 * nele com Tab, e `disabled` tiraria o card da ordem de foco).
 */
export function TimerModeToggle({ value, onChange, isLocked }: TimerModeToggleProps) {
  return (
    <div className="flex w-full flex-col gap-2">
      <span className="text-style-label-sm uppercase tracking-wide text-text-muted">Escolha seu modo</span>

      <div
        className="flex w-full flex-col gap-2 rounded-2xl border border-border bg-surface p-2 shadow-card sm:flex-row"
        role="tablist"
        aria-label="Modo do timer"
      >
        {OPTIONS.map((option) => {
          const isActive = option.value === value
          const isCardLocked = Boolean(isLocked) && !isActive
          const titleId = `mode-title-${option.value}`
          const descId = `mode-desc-${option.value}`
          const tooltipId = `mode-lock-tooltip-${option.value}`

          return (
            <div key={option.value} className="group relative flex-1">
              <button
                type="button"
                role="tab"
                aria-selected={isActive}
                aria-disabled={isCardLocked || undefined}
                aria-labelledby={titleId}
                aria-describedby={isCardLocked ? `${descId} ${tooltipId}` : descId}
                onClick={() => {
                  if (isCardLocked) return
                  onChange(option.value)
                }}
                className={`flex w-full items-start gap-3 rounded-xl border p-4 text-left transition-colors ${
                  isActive
                    ? 'border-primary bg-primary-bg'
                    : isCardLocked
                      ? 'cursor-not-allowed border-dashed border-border opacity-50'
                      : 'cursor-pointer border-transparent hover:bg-bg-subtle'
                }`}
              >
                <span
                  aria-hidden="true"
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
                    isActive ? 'bg-primary text-on-primary' : 'bg-bg-subtle text-text-muted'
                  }`}
                >
                  {option.icon}
                </span>
                <span className="min-w-0 flex-1">
                  <span id={titleId} className="block text-style-label-lg text-text-h">
                    {option.title}
                  </span>
                  <span id={descId} className="block text-style-body-sm text-text-muted">
                    {option.description}
                  </span>
                </span>
                {isCardLocked && (
                  <span aria-hidden="true" className="shrink-0 text-text-muted">
                    🔒
                  </span>
                )}
              </button>

              {isCardLocked && (
                <div
                  id={tooltipId}
                  role="tooltip"
                  className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-2 w-max max-w-[260px] -translate-x-1/2 rounded-lg border border-border bg-surface px-3 py-2 text-style-body-sm text-text-h opacity-0 shadow-popover transition-opacity duration-150 group-hover:opacity-100 group-focus-within:opacity-100"
                >
                  {LOCK_TOOLTIP_TEXT}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
