export function Banner({ kind, message }: { kind: 'error' | 'success'; message: string }) {
  const variantClasses = kind === 'error' ? 'bg-danger-bg text-danger' : 'bg-secondary-bg text-secondary-dark'
  return (
    <p className={`mb-4 rounded-lg px-4 py-2 text-style-body-sm ${variantClasses}`} role="status">
      {message}
    </p>
  )
}
