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
    title: 'Aceitação dos termos',
    body: 'Ao criar uma conta ou utilizar o Guardião Pomodoro, você concorda com estes Termos de Uso e com a nossa Política de Privacidade. Se você não concorda com algum destes termos, não deve criar uma conta nem utilizar o serviço.',
  },
  {
    number: 2,
    title: 'Descrição do serviço',
    body: 'O Guardião Pomodoro é uma ferramenta de produtividade pessoal baseada na técnica Pomodoro, que permite cronometrar períodos de foco e pausa, registrar tarefas e acompanhar seu progresso ao longo do tempo.',
  },
  {
    number: 3,
    title: 'Modo convidado e modo conta',
    body: 'Você pode usar o aplicativo sem criar conta ("modo convidado"): seus dados ficam salvos apenas neste navegador, sob sua responsabilidade — perder o navegador ou limpar seus dados locais significa perder esse histórico. Ao criar uma conta, seus dados passam a ser armazenados em nossos servidores, associados ao seu e-mail e senha.',
  },
  {
    number: 4,
    title: 'Responsabilidades da conta',
    body: 'Você é responsável por manter a confidencialidade da sua senha e por todas as atividades realizadas com sua conta. Informe-nos imediatamente caso suspeite de uso não autorizado.',
  },
  {
    number: 5,
    title: 'Uso aceitável',
    body: 'Você concorda em não utilizar o serviço para fins ilegais, para tentar acessar dados de outros usuários, ou para interferir no funcionamento normal da plataforma.',
  },
  {
    number: 6,
    title: 'Isenção de garantias e limitação de responsabilidade',
    body: 'O serviço é fornecido "como está", sem garantias de disponibilidade contínua ou ausência de erros. Na máxima extensão permitida por lei, não nos responsabilizamos por perda de dados, interrupções do serviço ou danos indiretos decorrentes do uso do aplicativo.',
  },
  {
    number: 7,
    title: 'Alterações nestes termos',
    body: 'Podemos atualizar estes Termos de Uso periodicamente. Mudanças significativas serão comunicadas dentro do próprio aplicativo. O uso continuado do serviço após uma alteração implica concordância com os novos termos.',
  },
  {
    number: 8,
    title: 'Contato',
    body: 'Dúvidas sobre estes termos podem ser enviadas para o e-mail de suporte informado na página inicial do aplicativo.',
  },
]

/**
 * Página pública (fora de `AppShell`/`ProtectedRoute`): precisa funcionar tanto aberta a partir do
 * cadastro (sem sessão) quanto a partir do menu do app (logado).
 */
export function TermosDeUsoPage() {
  return (
    <div className="mx-auto flex min-h-svh max-w-[640px] flex-col gap-4 p-6">
      <header className="flex items-center justify-between gap-4">
        <p className="flex items-center gap-2 text-style-headline-sm text-primary-dark">
          <span aria-hidden="true">📄</span> Guardião Pomodoro
        </p>
        <Link
          to="/timer"
          className="rounded-full border border-border px-3 py-1.5 text-style-label-md text-primary-dark no-underline transition-colors hover:bg-bg-subtle"
        >
          <span aria-hidden="true">← </span>Voltar
        </Link>
      </header>

      <h1>Termos de Uso</h1>

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
