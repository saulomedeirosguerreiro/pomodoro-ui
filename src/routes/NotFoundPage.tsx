import { useNavigate } from 'react-router-dom'
import { Button } from '../components/common/Button'
import { TomatoArt } from '../components/Mascot/TomatoArt'

/**
 * Página pública (fora de `AppShell`): é o catch-all de App.tsx, então precisa funcionar com ou sem
 * sessão — qualquer rota que não bate com nada cai aqui.
 */
export function NotFoundPage() {
  const navigate = useNavigate()

  return (
    <div className="relative flex min-h-svh flex-col items-center justify-center overflow-hidden px-6 py-16">
      {/* Glow ambiente — só profundidade, sem formar nenhuma figura legível por leitor de tela. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-[38%] h-[420px] w-[420px] -translate-x-[60%] -translate-y-1/2 rounded-full bg-primary-bg blur-[90px]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-[55%] h-[320px] w-[320px] -translate-x-[20%] -translate-y-1/2 rounded-full bg-secondary-bg blur-[90px]"
      />

      <div className="relative flex w-full max-w-[420px] flex-col items-center gap-10 text-center">
        <p
          aria-hidden="true"
          className="select-none text-[96px] font-extrabold leading-none tracking-tight text-primary sm:text-[132px]"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          404
        </p>

        <div className="relative -mt-6 inline-flex animate-[confusedWobble_2.4s_ease-in-out_infinite]">
          <TomatoArt />
          <span className="pointer-events-none absolute -inset-4 text-lg" aria-hidden="true">
            <span className="absolute left-0 top-0 animate-[particleRise_1.8s_ease-out_infinite] [animation-delay:0s]">
              ❓
            </span>
            <span className="absolute left-1/2 top-0 -translate-x-1/2 animate-[particleRise_1.8s_ease-out_infinite] [animation-delay:0.6s]">
              ❓
            </span>
            <span className="absolute right-0 top-0 animate-[particleRise_1.8s_ease-out_infinite] [animation-delay:1.2s]">
              ❓
            </span>
          </span>
        </div>

        <div className="flex flex-col gap-2">
          <h1 className="text-style-headline-xl text-text-h">Página não encontrada</h1>
          <p className="text-style-body-md text-text-muted">
            Cavei o canteiro inteiro e essa página não brotou por aqui.
          </p>
        </div>

        <Button onClick={() => navigate('/timer', { replace: true })}>Voltar para o Timer</Button>
      </div>
    </div>
  )
}
