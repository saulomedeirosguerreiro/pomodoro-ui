import { useNavigate } from 'react-router-dom'
import { Button } from '../components/common/Button'
import { SpeechBubble } from '../components/common/SpeechBubble'
import { TomatoArt } from '../components/Mascot/TomatoArt'

/**
 * Página pública (fora de `AppShell`): é o catch-all de App.tsx, então precisa funcionar com ou sem
 * sessão — qualquer rota que não bate com nada cai aqui.
 */
export function NotFoundPage() {
  const navigate = useNavigate()

  return (
    <div className="mx-auto flex min-h-svh max-w-[480px] flex-col items-center justify-center gap-6 p-6 text-center">
      <p
        aria-hidden="true"
        className="animate-[mascotFloat_3.2s_ease-in-out_infinite] text-style-display-timer-mobile text-primary sm:text-style-display-timer"
      >
        404
      </p>

      <div className="relative inline-flex animate-[confusedWobble_2.4s_ease-in-out_infinite]">
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

      <div className="flex flex-col gap-3">
        <h1 className="text-style-headline-sm text-text-h">Página não encontrada</h1>
        <SpeechBubble>Cavei o canteiro inteiro e essa página não brotou por aqui.</SpeechBubble>
      </div>

      <Button onClick={() => navigate('/timer', { replace: true })}>Voltar para o Timer</Button>
    </div>
  )
}
