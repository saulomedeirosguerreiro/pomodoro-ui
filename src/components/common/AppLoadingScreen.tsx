import { useTranslation } from 'react-i18next'
import { BrandLogo } from './BrandLogo'

/**
 * Gate de boot do app (`ProtectedRoute`/`PublicOnlyRoute`, enquanto `AuthContext`/`GuestContext`
 * ainda não resolveram) — antes disto era `return null`, o que deixava só a cor de fundo visível
 * (parecendo travado) sempre que a checagem de `/me` demorasse (cold start de backend, rede lenta).
 * `apiClient.ts` já limita essa espera a `REQUEST_TIMEOUT_MS`; esta tela só preenche o tempo até lá.
 */
export function AppLoadingScreen() {
  const { t } = useTranslation('common')

  return (
    <div className="flex min-h-svh w-full flex-col items-center justify-center gap-4 bg-bg" role="status" aria-live="polite">
      <BrandLogo size="lg" />
      <div
        aria-hidden="true"
        className="h-8 w-8 animate-spin rounded-full border-4 border-border border-t-primary"
      />
      <span className="sr-only">{t('appLoading')}</span>
    </div>
  )
}
