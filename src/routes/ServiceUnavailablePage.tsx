import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { TomatoArt } from '../components/Mascot/TomatoArt'
import { Button } from '../components/common/Button'
import { useAuth } from '../context/AuthContext'

/**
 * Destino do redirect disparado por ServerErrorRedirect (App.tsx) sempre que algum `api.*` voltar com
 * 5xx de verdade, ou nem conseguir falar com a API (connection refused/backend fora do ar) — ver
 * SERVER_ERROR_EVENT em apiClient.ts. Fora de ProtectedRoute/PublicOnlyRoute de
 * propósito, igual TermosDeUsoPage/PoliticaDePrivacidadePage: um 5xx pode acontecer tanto logado quanto
 * numa tentativa de login, então a rota precisa renderizar nos dois casos.
 *
 * "Tentar novamente" rechama `refreshProfile()` antes de voltar pro /timer — sem isso, um 5xx durante o
 * próprio check de `/me` no boot (AuthContext.tsx) deixaria `user` preso em `null` (tratado como "sem
 * conta"), e só navegar de volta não dispararia uma nova tentativa daquele check.
 */
export function ServiceUnavailablePage() {
  const { t } = useTranslation('common')
  const navigate = useNavigate()
  const { refreshProfile } = useAuth()

  const handleRetry = () => {
    refreshProfile().catch(() => {})
    navigate('/timer', { replace: true })
  }

  return (
    <div
      className="relative flex min-h-svh flex-col items-center justify-center overflow-hidden px-6 py-16"
      role="alert"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-[38%] h-[420px] w-[420px] -translate-x-[60%] -translate-y-1/2 rounded-full bg-primary-bg blur-[90px]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-[55%] h-[320px] w-[320px] -translate-x-[20%] -translate-y-1/2 rounded-full bg-secondary-bg blur-[90px]"
      />

      <div className="relative flex w-full max-w-[420px] flex-col items-center gap-8 text-center">
        <div className="relative inline-flex animate-[sleepyNod_4s_ease-in-out_infinite]">
          <TomatoArt />
          <span className="pointer-events-none absolute -inset-4 text-lg" aria-hidden="true">
            <span className="absolute left-0 top-0 animate-[particleRise_1.8s_ease-out_infinite] [animation-delay:0s]">
              💤
            </span>
            <span className="absolute left-1/2 top-0 -translate-x-1/2 animate-[particleRise_1.8s_ease-out_infinite] [animation-delay:0.6s]">
              💤
            </span>
            <span className="absolute right-0 top-0 animate-[particleRise_1.8s_ease-out_infinite] [animation-delay:1.2s]">
              💤
            </span>
          </span>
        </div>

        <div className="flex flex-col gap-2">
          <h1 className="text-style-headline-xl text-text-h">{t('serviceUnavailable.title')}</h1>
          <p className="text-style-body-md text-text-muted">{t('serviceUnavailable.body')}</p>
        </div>

        <Button onClick={handleRetry}>{t('serviceUnavailable.retryButton')}</Button>
      </div>
    </div>
  )
}
