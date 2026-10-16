import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'

export interface SegmentedOption<T extends string> {
  value: T
  label: string
  icon?: ReactNode
  disabled?: boolean
  /** Texto do tooltip quando `disabled` — default: "Bloqueado durante a sessão". */
  disabledReason?: string
}

interface SegmentedControlProps<T extends string> {
  options: SegmentedOption<T>[]
  value: T
  onChange: (value: T) => void
  ariaLabel: string
}

export function SegmentedControl<T extends string>({ options, value, onChange, ariaLabel }: SegmentedControlProps<T>) {
  const { t } = useTranslation('common')

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
            disabled={option.disabled}
            title={option.disabled ? (option.disabledReason ?? t('lockedDuringSession')) : undefined}
            className={`inline-flex items-center gap-1 whitespace-nowrap rounded-full px-4 py-2.5 max-[480px]:px-3 text-style-label-md max-[480px]:text-style-label-sm text-text-muted transition-colors hover:text-text-h disabled:cursor-not-allowed disabled:opacity-45 disabled:hover:text-text-muted ${
              isActive ? 'bg-surface-raised text-style-label-lg max-[480px]:text-style-label-md text-primary-dark' : 'bg-transparent'
            } ${option.disabled ? '' : 'cursor-pointer'}`}
            onClick={() => onChange(option.value)}
          >
            {option.icon}
            {option.label}
            {option.disabled && (
              <span aria-hidden="true" className="ml-0.5">
                🔒
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}
