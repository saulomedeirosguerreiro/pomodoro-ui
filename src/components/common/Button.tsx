import type { ButtonHTMLAttributes } from 'react'

type ButtonVariant = 'primary' | 'secondary' | 'ghost'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  fullWidth?: boolean
}

const BASE_CLASSES =
  'inline-flex cursor-pointer items-center justify-center gap-2 rounded-full border-0 px-6 py-3 text-style-label-lg transition-[transform,box-shadow] duration-150 ease-out disabled:translate-y-0! disabled:cursor-not-allowed disabled:opacity-60 disabled:shadow-none!'

const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  primary:
    'bg-primary text-on-primary shadow-bevel-primary hover:-translate-y-0.5 active:translate-y-[3px] active:shadow-[0_1px_0_0_var(--color-primary-dark)]',
  secondary:
    'bg-secondary text-on-secondary shadow-bevel-secondary hover:-translate-y-0.5 active:translate-y-[3px] active:shadow-[0_1px_0_0_var(--color-secondary-dark)]',
  ghost: 'border-2 border-border bg-bg-subtle text-text-h shadow-none active:translate-y-0.5',
}

export function Button({ variant = 'primary', fullWidth, className, ...props }: ButtonProps) {
  const classes = [BASE_CLASSES, VARIANT_CLASSES[variant], fullWidth ? 'w-full' : '', className]
    .filter(Boolean)
    .join(' ')

  return <button className={classes} {...props} />
}
