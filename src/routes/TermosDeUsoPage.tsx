import { Link } from 'react-router-dom'

const CARD_CLASSES = 'flex flex-col gap-2 rounded-2xl border border-border bg-surface p-4 shadow-card'

/**
 * Página pública (fora de `AppShell`/`ProtectedRoute`): precisa funcionar tanto aberta a partir do
 * cadastro (sem sessão) quanto a partir do menu do app (logado).
 */
export function TermosDeUsoPage() {
  return (
    <div className="mx-auto flex min-h-svh max-w-[640px] flex-col gap-4 p-6">
      <header className="flex items-center justify-between gap-4">
        <p className="text-style-headline-sm text-primary-dark">Guardião Pomodoro</p>
        <Link to="/timer" className="text-style-label-md text-primary-dark no-underline hover:underline">
          Voltar
        </Link>
      </header>

      <h1>Termos de Uso</h1>

      <section className={CARD_CLASSES}>
        <p className="text-style-body-sm text-text-muted">
          Este é um texto-modelo, pensado para um aplicativo pessoal de produtividade. Ele serve como ponto
          de partida e não substitui revisão por um profissional jurídico antes do uso em produção.
        </p>
      </section>

      <section className={CARD_CLASSES}>
        <h2 className="text-style-headline-sm">1. Aceitação dos termos</h2>
        <p className="text-style-body-md text-text">
          Ao criar uma conta ou utilizar o Guardião Pomodoro, você concorda com estes Termos de Uso e com a
          nossa Política de Privacidade. Se você não concorda com algum destes termos, não deve criar uma
          conta nem utilizar o serviço.
        </p>
      </section>

      <section className={CARD_CLASSES}>
        <h2 className="text-style-headline-sm">2. Descrição do serviço</h2>
        <p className="text-style-body-md text-text">
          O Guardião Pomodoro é uma ferramenta de produtividade pessoal baseada na técnica Pomodoro, que
          permite cronometrar períodos de foco e pausa, registrar tarefas e acompanhar seu progresso ao
          longo do tempo.
        </p>
      </section>

      <section className={CARD_CLASSES}>
        <h2 className="text-style-headline-sm">3. Modo convidado e modo conta</h2>
        <p className="text-style-body-md text-text">
          Você pode usar o aplicativo sem criar conta ("modo convidado"): seus dados ficam salvos apenas
          neste navegador, sob sua responsabilidade — perder o navegador ou limpar seus dados locais
          significa perder esse histórico. Ao criar uma conta, seus dados passam a ser armazenados em
          nossos servidores, associados ao seu e-mail e senha.
        </p>
      </section>

      <section className={CARD_CLASSES}>
        <h2 className="text-style-headline-sm">4. Responsabilidades da conta</h2>
        <p className="text-style-body-md text-text">
          Você é responsável por manter a confidencialidade da sua senha e por todas as atividades
          realizadas com sua conta. Informe-nos imediatamente caso suspeite de uso não autorizado.
        </p>
      </section>

      <section className={CARD_CLASSES}>
        <h2 className="text-style-headline-sm">5. Uso aceitável</h2>
        <p className="text-style-body-md text-text">
          Você concorda em não utilizar o serviço para fins ilegais, para tentar acessar dados de outros
          usuários, ou para interferir no funcionamento normal da plataforma.
        </p>
      </section>

      <section className={CARD_CLASSES}>
        <h2 className="text-style-headline-sm">6. Isenção de garantias e limitação de responsabilidade</h2>
        <p className="text-style-body-md text-text">
          O serviço é fornecido "como está", sem garantias de disponibilidade contínua ou ausência de
          erros. Na máxima extensão permitida por lei, não nos responsabilizamos por perda de dados,
          interrupções do serviço ou danos indiretos decorrentes do uso do aplicativo.
        </p>
      </section>

      <section className={CARD_CLASSES}>
        <h2 className="text-style-headline-sm">7. Alterações nestes termos</h2>
        <p className="text-style-body-md text-text">
          Podemos atualizar estes Termos de Uso periodicamente. Mudanças significativas serão comunicadas
          dentro do próprio aplicativo. O uso continuado do serviço após uma alteração implica concordância
          com os novos termos.
        </p>
      </section>

      <section className={CARD_CLASSES}>
        <h2 className="text-style-headline-sm">8. Contato</h2>
        <p className="text-style-body-md text-text">
          Dúvidas sobre estes termos podem ser enviadas para o e-mail de suporte informado na página inicial
          do aplicativo.
        </p>
      </section>
    </div>
  )
}
