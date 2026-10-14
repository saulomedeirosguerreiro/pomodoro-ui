import guardiaoPomodoroIcon from '../../assets/guardiao-pomodoro-logo.svg'

interface BrandLogoProps {
  /** `sm` para a sidebar (compacta), `lg` para o cabeçalho das telas de login/cadastro/recuperação. */
  size?: 'sm' | 'lg'
  className?: string
}

// O ícone tem viewBox 200x220 (um pouco mais alto que largo) — `h-X w-auto` preserva essa proporção;
// `w-12`/`w-14` quadrados espremiam o morango e desalinhavam o conjunto com o texto ao lado.
const SIZE_CLASSES = {
  sm: { wrapper: 'gap-2.5', icon: 'h-12 w-auto', title: 'text-[22px]', subtitle: 'text-[11px]' },
  lg: { wrapper: 'gap-3', icon: 'h-14 w-auto', title: 'text-[26px]', subtitle: 'text-[13px]' },
}

/**
 * Marca "Guardião Pomodoro": ícone de `assets/guardiao-pomodoro-logo.svg` + wordmark "Guardião"
 * (`text-text-h`, acompanha o tema claro/escuro) / "POMODORO" (vermelho fixo, igual ao fill do ícone).
 */
export function BrandLogo({ size = 'sm', className = '' }: BrandLogoProps) {
  const sizes = SIZE_CLASSES[size]

  return (
    <div className={`inline-flex items-center ${sizes.wrapper} ${className}`}>
      <img src={guardiaoPomodoroIcon} alt="" aria-hidden="true" className={`${sizes.icon} shrink-0`} />
      <div className="flex flex-col leading-tight">
        <span className={`font-extrabold text-text-h ${sizes.title}`}>Guardião</span>
        <span className={`font-bold tracking-[0.18em] text-[#D63A22] ${sizes.subtitle}`}>POMODORO</span>
      </div>
    </div>
  )
}
