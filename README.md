# PomoGarden — Frontend

Frontend do PomoGarden: Pomodoro gamificado (temporizador, tarefas vinculadas a pomodoros, progresso de
XP/nível/sementes/streak, jardim de foco e conquistas). O backend (ASP.NET Core 8) vive num repositório
irmão: [pomodoro-api](https://github.com/saulomedeirosguerreiro/pomodoro-api).

## Tecnologias utilizadas

- **React 19 + TypeScript + Vite**
- **react-router-dom** (rotas e guards de autenticação)
- **CSS Modules** com um design system próprio em tokens (`src/styles/tokens.css`) — sem biblioteca de componentes
- **Vitest + Testing Library** (testes)
- Preferências do usuário (notificações, falas do mascote, reduzir animações, som de fim de sessão) ficam só
  no `localStorage` do navegador — não existe tabela de configurações no backend

## Como instalar as dependências

Pré-requisito: **Node.js 20+**.

```bash
npm install
```

## Como configurar as variáveis de ambiente

Copie o exemplo e ajuste se a API não estiver em `http://localhost:5134`:
```bash
cp .env.example .env
```
```
VITE_API_URL=http://localhost:5134
```

> Suba o [pomodoro-api](https://github.com/saulomedeirosguerreiro/pomodoro-api) antes (ou em paralelo) —
> este frontend não funciona sozinho, ele só consome a API. O `Cors:AllowedOrigin` da API precisa bater com
> a origem de onde este frontend sobe (`http://localhost:5173` por padrão).

`VITE_GA_MEASUREMENT_ID` é opcional (Google Analytics 4, formato `G-XXXXXXXXXX`, em Admin > Fluxos
de dados > fluxo Web da propriedade GA4). Sem essa variável o app funciona normalmente e nenhum
evento é enviado (ver `src/lib/analytics.ts`); com ela, o envio vem ligado por padrão e cada pessoa
pode desativar em Configurações > Privacidade (ver `PoliticaDePrivacidadePage.tsx` para o texto de
divulgação).

## Como executar em desenvolvimento

```bash
npm run dev
```

Abre em `http://localhost:5173`. Fluxo: `/cadastro` → `/login` → `/timer` (timer, tarefas, jardim,
conquistas, configurações e ajuda ficam na navegação lateral/topbar).

## Como gerar o build de produção

```bash
npm run build    # tsc -b && vite build
npm run preview  # serve o build gerado em dist/, localmente
```

## Como executar os testes

98 testes (Vitest + Testing Library).

```bash
npm test
```

## Mapa de rotas

```
/cadastro         cadastro de usuário
/login            login
/timer            temporizador (foco/pausa curta/pausa longa), checklist de foco, jardim de hoje
/tarefas          CRUD de tarefas com filtro por status
/jardim           coleção de plantas + histórico completo de sessões
/conquistas       catálogo de conquistas (desbloqueadas com data, bloqueadas com progresso)
/configuracoes    preferências locais (notificações, mascote, animações, som) e exclusão de conta
/ajuda            explicação de Pomodoro/ciclo/XP/nível/sementes/streak/jardim
```

## Notas de arquitetura e decisões

- **Timer:** roda inteiramente no cliente; o tempo restante é calculado pelo relógio real (não por
  contagem de ticks), sobrevivendo a abas em segundo plano e à navegação entre rotas — o estado fica num
  `TimerContext` acima das rotas. Só o registro final de cada período é persistido via API.
- **Datas:** o histórico de sessões exibe no fuso do navegador (`dd/MM/aaaa HH:mm`); para streak e resumo
  do dia, o cliente manda `tz` (`Intl.DateTimeFormat().resolvedOptions().timeZone`) nas consultas de
  progresso.
- **Tarefas:** entidade do backend, não localStorage — a tarefa `em_curso` é automaticamente vinculada ao
  próximo foco registrado.
- **Conquistas e nível:** um toast aparece quando uma conquista nova é desbloqueada ou o usuário sobe de
  nível, comparando o estado anterior e o novo a cada registro de sessão concluída.
- **`frontend/src/lib/gameConstants.ts`** espelha as constantes de XP/sementes/nível do domínio do backend
  (`Pomodoro.Domain.Services.ProgressRules`), só para exibição na página Ajuda — não há pacote
  compartilhado entre os dois repositórios nesta fase, então uma mudança nas fórmulas do backend precisa
  ser replicada aqui também.
- **Exclusão de conta:** em Configurações, pede a senha atual (reautenticação) antes de chamar
  `DELETE /api/users/me`. Em caso de sucesso, desloga localmente e redireciona para `/login` — é o backend
  quem de fato apaga os dados, em cascata.

## Pendências conhecidas (débito documentado, não bug)

- **Mascote (Tomatinho):** usa um placeholder SVG único (sem variação de arte por estado) — a troca de
  estado (ocioso/focado/quase lá/descansando/pausado/comemorando/acolhendo) muda só a animação e a fala,
  nunca o desenho. Se/quando chegar uma arte licenciada com estados próprios, trocar
  `src/components/Mascot/TomatoArt.tsx`.
- **Lo-Fi (resolvido):** o player dentro do Checklist (`src/components/Sound/LofiPlayer.tsx`) toca de
  verdade — 19 faixas reais (licença Pixabay Content License, uso livre) em `public/audio/lofi/`,
  catalogadas com título e crédito em `src/lib/soundCatalog.ts`. Se algum arquivo faltar ou falhar ao
  carregar, cai no mesmo aviso honesto de indisponibilidade em vez de quebrar.
- **Som ambiente:** a interface completa existe (seleção, play/pause, volume, preferência persistida),
  mas **não há nenhum arquivo de áudio real** — clicar em "play" sempre mostra o aviso honesto de
  indisponibilidade. Quando os arquivos (licença livre, CC0/royalty-free) chegarem, o catálogo fica em
  `src/lib/soundCatalog.ts` (`AMBIENT_TRACKS`). O som de fim de sessão (`src/lib/sound.ts`) é separado
  disso — já funciona de verdade, só que sintetizado via Web Audio API, sem arquivo.
