import { Link } from 'react-router-dom'

const CARD_CLASSES = 'flex flex-col gap-2 rounded-2xl border border-border bg-surface p-4 shadow-card'

/**
 * Página pública (fora de `AppShell`/`ProtectedRoute`): precisa funcionar tanto aberta a partir do
 * cadastro (sem sessão) quanto a partir do menu do app (logado).
 */
export function CopyrightPage() {
  return (
    <div className="mx-auto flex min-h-svh max-w-[640px] flex-col gap-4 p-6">
      <header className="flex items-center justify-between gap-4">
        <p className="text-style-headline-sm text-primary-dark">Guardião Pomodoro</p>
        <Link to="/timer" className="text-style-label-md text-primary-dark no-underline hover:underline">
          Voltar
        </Link>
      </header>

      <h1>Copyright</h1>

      <section className={CARD_CLASSES}>
        <p className="text-style-body-sm text-text-muted">
          Este é um texto-modelo, pensado para um aplicativo pessoal de produtividade. Ele serve como ponto
          de partida e não substitui revisão por um profissional jurídico antes do uso em produção.
        </p>
      </section>

      <section className={CARD_CLASSES}>
        <h2 className="text-style-headline-sm">Direitos autorais</h2>
        <p className="text-style-body-md text-text">
          © 2026 Guardião Pomodoro. Todos os direitos reservados. O nome, a marca, o design visual e o
          conteúdo original do aplicativo Guardião Pomodoro são protegidos por direitos autorais e não podem
          ser reproduzidos, distribuídos ou utilizados comercialmente sem autorização prévia.
        </p>
      </section>

      <section className={CARD_CLASSES}>
        <h2 className="text-style-headline-sm">Bibliotecas de terceiros</h2>
        <p className="text-style-body-md text-text">
          Este aplicativo utiliza bibliotecas de código aberto de terceiros, cada uma sujeita à sua própria
          licença. O uso dessas bibliotecas não implica cessão de direitos sobre o conteúdo original do
          Guardião Pomodoro.
        </p>
      </section>

      <section className={CARD_CLASSES}>
        <h2 className="text-style-headline-sm">Solicitações de remoção de conteúdo</h2>
        <p className="text-style-body-md text-text">
          Caso acredite que algum conteúdo exibido no aplicativo viola seus direitos autorais, entre em
          contato pelo e-mail de suporte informado na página inicial do aplicativo, descrevendo o conteúdo em
          questão.
        </p>
      </section>
    </div>
  )
}
