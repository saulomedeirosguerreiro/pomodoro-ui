import { Link } from 'react-router-dom'

const CARD_CLASSES = 'flex flex-col gap-2 rounded-2xl border border-border bg-surface p-4 shadow-card'

interface SectionConfig {
  number: number
  title: string
  body: string
}

const SECTIONS: SectionConfig[] = [
  {
    number: 1,
    title: 'Dados que coletamos',
    body: 'Ao criar uma conta, coletamos seu nome, e-mail e senha (armazenada apenas de forma criptografada, nunca em texto puro). Também armazenamos os dados que você gera usando o aplicativo: tarefas, sessões de foco e pausa, e seu progresso (nível, XP, conquistas). No modo convidado, esses mesmos dados ficam salvos apenas no armazenamento local do seu navegador, e nunca chegam aos nossos servidores.',
  },
  {
    number: 2,
    title: 'Finalidade do uso dos dados',
    body: 'Usamos esses dados exclusivamente para fornecer e melhorar o funcionamento do aplicativo: autenticar sua conta, exibir seu histórico e progresso, e manter suas preferências entre sessões.',
  },
  {
    number: 3,
    title: 'Não comercialização de dados',
    body: 'Não vendemos, alugamos nem compartilhamos seus dados pessoais com terceiros para fins de publicidade ou marketing.',
  },
  {
    number: 4,
    title: 'Armazenamento local (localStorage)',
    body: 'O aplicativo usa o armazenamento local do seu navegador (`localStorage`) para guardar preferências (como tema claro/escuro e durações de foco/pausa) e, no modo convidado, todo o seu histórico de uso. Esses dados não são cookies de rastreamento de terceiros e não são compartilhados com nenhum serviço externo.',
  },
  {
    number: 5,
    title: 'Retenção e exclusão de dados',
    body: 'Mantemos os dados da sua conta enquanto ela existir. Você pode solicitar a exclusão da sua conta e dos dados associados a qualquer momento. No modo convidado, a opção "Apagar meus dados deste dispositivo", em Configurações, remove permanentemente os dados salvos neste navegador.',
  },
  {
    number: 6,
    title: 'Seus direitos',
    body: 'Em conformidade com a Lei Geral de Proteção de Dados (LGPD), você tem direito a acessar, corrigir, portar ou solicitar a exclusão dos seus dados pessoais, entrando em contato pelos canais indicados abaixo.',
  },
  {
    number: 7,
    title: 'Contato',
    body: 'Dúvidas ou solicitações sobre esta Política de Privacidade podem ser enviadas para o e-mail de suporte informado na página inicial do aplicativo.',
  },
]

/**
 * Página pública (fora de `AppShell`/`ProtectedRoute`): precisa funcionar tanto aberta a partir do
 * cadastro (sem sessão) quanto a partir do menu do app (logado).
 */
export function PoliticaDePrivacidadePage() {
  return (
    <div className="mx-auto flex min-h-svh max-w-[640px] flex-col gap-4 p-6">
      <header className="flex items-center justify-between gap-4">
        <p className="flex items-center gap-2 text-style-headline-sm text-primary-dark">
          <span aria-hidden="true">🔒</span> Guardião Pomodoro
        </p>
        <Link
          to="/timer"
          className="rounded-full border border-border px-3 py-1.5 text-style-label-md text-primary-dark no-underline transition-colors hover:bg-bg-subtle"
        >
          <span aria-hidden="true">← </span>Voltar
        </Link>
      </header>

      <h1>Política de Privacidade</h1>

      <section className="flex flex-col gap-2 rounded-2xl border border-highlight bg-highlight-bg p-4">
        <p className="flex items-start gap-2 text-style-body-sm text-text">
          <span aria-hidden="true">ℹ️</span>
          <span>
            Este é um texto-modelo, pensado para um aplicativo pessoal de produtividade. Ele serve como ponto de
            partida e não substitui revisão por um profissional jurídico antes do uso em produção.
          </span>
        </p>
      </section>

      {SECTIONS.map((section) => (
        <section key={section.number} className={CARD_CLASSES}>
          <h2 className="flex items-center gap-2 text-style-headline-sm">
            <span
              aria-hidden="true"
              className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary-bg text-style-label-sm text-primary-dark"
            >
              {section.number}
            </span>
            {section.title}
          </h2>
          <p className="text-style-body-md text-text">{section.body}</p>
        </section>
      ))}

      <p className="pt-2 text-center text-style-label-sm text-text-muted">© 2026 Guardião Pomodoro — Saulo Guerreiro</p>
    </div>
  )
}
