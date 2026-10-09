import { Link } from 'react-router-dom'

const CARD_CLASSES = 'flex flex-col gap-2 rounded-2xl border border-border bg-surface p-4 shadow-card'

/**
 * Página pública (fora de `AppShell`/`ProtectedRoute`): precisa funcionar tanto aberta a partir do
 * cadastro (sem sessão) quanto a partir do menu do app (logado).
 */
export function PoliticaDePrivacidadePage() {
  return (
    <div className="mx-auto flex min-h-svh max-w-[640px] flex-col gap-4 p-6">
      <header className="flex items-center justify-between gap-4">
        <p className="text-style-headline-sm text-primary-dark">Guardião Pomodoro</p>
        <Link to="/timer" className="text-style-label-md text-primary-dark no-underline hover:underline">
          Voltar
        </Link>
      </header>

      <h1>Política de Privacidade</h1>

      <section className={CARD_CLASSES}>
        <p className="text-style-body-sm text-text-muted">
          Este é um texto-modelo, pensado para um aplicativo pessoal de produtividade. Ele serve como ponto
          de partida e não substitui revisão por um profissional jurídico antes do uso em produção.
        </p>
      </section>

      <section className={CARD_CLASSES}>
        <h2 className="text-style-headline-sm">1. Dados que coletamos</h2>
        <p className="text-style-body-md text-text">
          Ao criar uma conta, coletamos seu nome, e-mail e senha (armazenada apenas de forma criptografada,
          nunca em texto puro). Também armazenamos os dados que você gera usando o aplicativo: tarefas,
          sessões de foco e pausa, e seu progresso (nível, XP, conquistas). No modo convidado, esses mesmos
          dados ficam salvos apenas no armazenamento local do seu navegador, e nunca chegam aos nossos
          servidores.
        </p>
      </section>

      <section className={CARD_CLASSES}>
        <h2 className="text-style-headline-sm">2. Finalidade do uso dos dados</h2>
        <p className="text-style-body-md text-text">
          Usamos esses dados exclusivamente para fornecer e melhorar o funcionamento do aplicativo: autenticar
          sua conta, exibir seu histórico e progresso, e manter suas preferências entre sessões.
        </p>
      </section>

      <section className={CARD_CLASSES}>
        <h2 className="text-style-headline-sm">3. Não comercialização de dados</h2>
        <p className="text-style-body-md text-text">
          Não vendemos, alugamos nem compartilhamos seus dados pessoais com terceiros para fins de
          publicidade ou marketing.
        </p>
      </section>

      <section className={CARD_CLASSES}>
        <h2 className="text-style-headline-sm">4. Armazenamento local (localStorage)</h2>
        <p className="text-style-body-md text-text">
          O aplicativo usa o armazenamento local do seu navegador (`localStorage`) para guardar preferências
          (como tema claro/escuro e durações de foco/pausa) e, no modo convidado, todo o seu histórico de
          uso. Esses dados não são cookies de rastreamento de terceiros e não são compartilhados com
          nenhum serviço externo.
        </p>
      </section>

      <section className={CARD_CLASSES}>
        <h2 className="text-style-headline-sm">5. Retenção e exclusão de dados</h2>
        <p className="text-style-body-md text-text">
          Mantemos os dados da sua conta enquanto ela existir. Você pode solicitar a exclusão da sua conta e
          dos dados associados a qualquer momento. No modo convidado, a opção "Apagar meus dados deste
          dispositivo", em Configurações, remove permanentemente os dados salvos neste navegador.
        </p>
      </section>

      <section className={CARD_CLASSES}>
        <h2 className="text-style-headline-sm">6. Seus direitos</h2>
        <p className="text-style-body-md text-text">
          Em conformidade com a Lei Geral de Proteção de Dados (LGPD), você tem direito a acessar, corrigir,
          portar ou solicitar a exclusão dos seus dados pessoais, entrando em contato pelos canais indicados
          abaixo.
        </p>
      </section>

      <section className={CARD_CLASSES}>
        <h2 className="text-style-headline-sm">7. Contato</h2>
        <p className="text-style-body-md text-text">
          Dúvidas ou solicitações sobre esta Política de Privacidade podem ser enviadas para o e-mail de
          suporte informado na página inicial do aplicativo.
        </p>
      </section>
    </div>
  )
}
