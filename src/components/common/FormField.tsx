import { useState, type InputHTMLAttributes } from 'react'

interface FormFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string
  error?: string
}

/** Olho aberto/riscado — ícone padrão de "mostrar/ocultar senha" (mesma convenção de traço das
 *  demais em `ThemeToggle.tsx`: `stroke="currentColor"`, sem preenchimento). */
function EyeIcon({ revealed }: { revealed: boolean }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      width="20"
      height="20"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M1.5 12S5.5 5 12 5s10.5 7 10.5 7-4 7-10.5 7-10.5-7-10.5-7Z" />
      <circle cx="12" cy="12" r="3" />
      {!revealed && <line x1="2.5" y1="2.5" x2="21.5" y2="21.5" />}
    </svg>
  )
}

export function FormField({ label, error, id, type, ...inputProps }: FormFieldProps) {
  const fieldId = id ?? inputProps.name
  const errorId = error ? `${fieldId}-error` : undefined
  const isPassword = type === 'password'
  const [isRevealed, setIsRevealed] = useState(false)

  return (
    <div className="mb-4 flex flex-col gap-1">
      <label htmlFor={fieldId} className="text-style-label-md text-text-muted">
        {label}
      </label>
      <div className="relative">
        <input
          id={fieldId}
          type={isPassword && isRevealed ? 'text' : type}
          className={`w-full rounded-2xl border-2 border-border bg-input-bg px-4 py-3 text-style-body-md text-text-h focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary-bg aria-invalid:border-danger ${
            isPassword ? 'pr-12' : ''
          }`}
          aria-invalid={Boolean(error)}
          aria-describedby={errorId}
          {...inputProps}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setIsRevealed((prev) => !prev)}
            aria-label={isRevealed ? 'Ocultar senha' : 'Mostrar senha'}
            aria-pressed={isRevealed}
            className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer text-text-muted hover:text-text-h"
          >
            <EyeIcon revealed={isRevealed} />
          </button>
        )}
      </div>
      {error && (
        <p id={errorId} className="text-style-body-sm text-danger" role="alert">
          {error}
        </p>
      )}
    </div>
  )
}
