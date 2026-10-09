import type { InputHTMLAttributes } from 'react'

interface FormFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string
  error?: string
}

export function FormField({ label, error, id, ...inputProps }: FormFieldProps) {
  const fieldId = id ?? inputProps.name
  const errorId = error ? `${fieldId}-error` : undefined

  return (
    <div className="mb-4 flex flex-col gap-1">
      <label htmlFor={fieldId} className="text-style-label-md text-text-muted">
        {label}
      </label>
      <input
        id={fieldId}
        className="rounded-2xl border-2 border-border bg-input-bg px-4 py-3 text-style-body-md text-text-h focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary-bg aria-invalid:border-danger"
        aria-invalid={Boolean(error)}
        aria-describedby={errorId}
        {...inputProps}
      />
      {error && (
        <p id={errorId} className="text-style-body-sm text-danger" role="alert">
          {error}
        </p>
      )}
    </div>
  )
}
