import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'

const CARD_CLASSES = 'flex flex-col gap-2 rounded-2xl border border-border bg-surface p-4 shadow-card'

const SECTION_NUMBERS = [1, 2, 3, 4, 5, 6, 7, 8] as const

interface SectionContent {
  title: string
  body: string
}

/**
 * Página pública (fora de `AppShell`/`ProtectedRoute`): precisa funcionar tanto aberta a partir do
 * cadastro (sem sessão) quanto a partir do menu do app (logado).
 */
export function TermosDeUsoPage() {
  const { t } = useTranslation('legal')

  return (
    <div className="mx-auto flex min-h-svh max-w-[640px] flex-col gap-4 p-6">
      <header className="flex items-center justify-between gap-4">
        <p className="flex items-center gap-2 text-style-headline-sm text-primary-dark">
          <span aria-hidden="true">📄</span> {t('terms.brand')}
        </p>
        <Link
          to="/timer"
          className="rounded-full border border-border px-3 py-1.5 text-style-label-md text-primary-dark no-underline transition-colors hover:bg-bg-subtle"
        >
          {t('terms.back')}
        </Link>
      </header>

      <h1>{t('terms.title')}</h1>

      {SECTION_NUMBERS.map((number) => {
        const section = t(`terms.sections.${number}`, { returnObjects: true }) as SectionContent
        return (
          <section key={number} className={CARD_CLASSES}>
            <h2 className="flex items-center gap-2 text-style-headline-sm">
              <span
                aria-hidden="true"
                className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary-bg text-style-label-sm text-primary-dark"
              >
                {number}
              </span>
              {section.title}
            </h2>
            <p className="text-style-body-md text-text">{section.body}</p>
          </section>
        )
      })}

      <p className="pt-2 text-center text-style-label-sm text-text-muted">{t('terms.footer')}</p>
    </div>
  )
}
