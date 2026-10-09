import type { ReactNode } from 'react'

export interface SegmentedOption<T extends string> {
  value: T
  label: string
  icon?: ReactNode
}

interface SegmentedControlProps<T extends string> {
  options: SegmentedOption<T>[]
  value: T
  onChange: (value: T) => void
  ariaLabel: string
}

export function SegmentedControl<T extends string>({ options, value, onChange, ariaLabel }: SegmentedControlProps<T>) {
  return (
    <div
      className="inline-flex items-center gap-1 rounded-full border border-border bg-bg-subtle p-1.5 max-[480px]:w-full max-[480px]:overflow-x-auto"
      role="tablist"
      aria-label={ariaLabel}
    >
      {options.map((option) => {
        const isActive = option.value === value
        return (
          <button
            key={option.value}
            type="button"
            role="tab"
            aria-selected={isActive}
            className={`inline-flex cursor-pointer items-center gap-1 whitespace-nowrap rounded-full px-4 py-2.5 text-style-label-md text-text-muted transition-colors hover:text-text-h ${
              isActive ? 'bg-surface-raised text-style-label-lg text-primary-dark' : 'bg-transparent'
            }`}
            onClick={() => onChange(option.value)}
          >
            {option.icon}
            {option.label}
          </button>
        )
      })}
    </div>
  )
}
