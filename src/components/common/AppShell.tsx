import { useEffect, useState, type ReactNode } from 'react'
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useGuest } from '../../context/GuestContext'
import { useSettings } from '../../context/SettingsContext'
import { useTimerContext } from '../../context/TimerContext'
import { formatHoursAndMinutes, pluralizeCount, streakLabel } from '../../lib/format'
import { formatMMSS, SESSION_LABELS } from '../../lib/timerLogic'
import type { ProgressSummary } from '../../types/api'
import { LofiPlayerBar } from '../Sound/LofiPlayerBar'
import { Badge } from './Badge'
import { Button } from './Button'
import { Dialog } from './Dialog'
import { EventsBell } from './EventsBell'
import { ProfileMenu } from './ProfileMenu'
import { ProgressBar } from './ProgressBar'
import { PromoBar } from './PromoBar'
import { PromoCard } from './PromoCard'
import { ThemeToggle } from './ThemeToggle'
import { VisitorMenu } from './VisitorMenu'

const NAV_ITEMS = [
  { to: '/timer', label: 'Timer', icon: '⏱️' },
  { to: '/tarefas', label: 'Tarefas', icon: '✅' },
  { to: '/jardim', label: 'Jardim de Foco', icon: '🌱' },
  { to: '/conquistas', label: 'Conquistas', icon: '🏆' },
]

const LINK_BASE_CLASSES =
  'flex items-center gap-2 whitespace-nowrap rounded-lg px-4 py-2.5 text-style-label-lg text-text-muted no-underline transition-colors duration-150 hover:bg-bg-subtle hover:text-text-h'
const LINK_ACTIVE_CLASSES = 'bg-primary-bg text-primary-dark hover:bg-primary-bg hover:text-primary-dark'

interface SidebarContentProps {
  displayName: string
  isAccount: boolean
  progress: ProgressSummary | null
  onLogout: () => void
  /** Some do card de perfil quando não passado — a sidebar desktop já tem esse CTA no cabeçalho, só
      o menu hambúrguer do mobile (sem cabeçalho de desktop) passa essa prop. */
  onAccessAccount?: () => void
  /** Fecha o menu hambúrguer ao navegar — `undefined` na sidebar desktop, que não tem o que fechar. */
  onNavigate?: () => void
  /** Card de divulgação, logo acima de Configurações — só a sidebar desktop passa; o menu hambúrguer
      do mobile não, porque o mobile já tem a própria `PromoBar` fixa no rodapé (evita duplicar). */
  promoSlot?: ReactNode
}

/**
 * Conteúdo do menu (marca, perfil, navegação principal, CTA de foco, links secundários +
 * copyright) — compartilhado entre a sidebar fixa do desktop e o menu hambúrguer do mobile
 * (responsividade mobile). Sem nenhuma classe `hidden`/`lg:` aqui dentro: quem decide se aparece é
 * sempre o contêiner que o usa, nunca este componente.
 */
function SidebarContent({
  displayName,
  isAccount,
  progress,
  onLogout,
  onAccessAccount,
  onNavigate,
  promoSlot,
}: SidebarContentProps) {
  return (
    <>
      <div className="flex items-center gap-2 p-1">
        <span className="text-[28px]" aria-hidden="true">
          🍅
        </span>
        <div>
          <p className="text-style-headline-sm text-primary-dark">Guardião Pomodoro</p>
          <p className="text-style-label-sm text-secondary-dark">Horta em Crescimento</p>
        </div>
      </div>

      <div className="flex flex-col gap-2 rounded-lg border border-border bg-bg-subtle p-4">
        <p className="overflow-hidden text-ellipsis whitespace-nowrap text-style-label-lg text-text-h">{displayName}</p>
        {progress && (
          <>
            <p className="text-style-label-sm text-primary-dark">
              Nível {progress.level} • {progress.title}
            </p>
            <div className="flex items-center gap-2">
              <div className="flex-1">
                <ProgressBar value={progress.xpInLevel} max={progress.xpForNextLevel} />
              </div>
              <span className="whitespace-nowrap text-style-label-sm text-text-muted">
                {progress.xpInLevel}/{progress.xpForNextLevel} XP
              </span>
            </div>
          </>
        )}
        {isAccount ? (
          <Button variant="ghost" fullWidth onClick={onLogout}>
            Sair
          </Button>
        ) : (
          onAccessAccount && (
            <Button variant="ghost" fullWidth onClick={onAccessAccount}>
              Acessar minha conta
            </Button>
          )
        )}
      </div>

      <nav className="flex flex-col gap-1" aria-label="Navegação principal">
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            onClick={onNavigate}
            className={({ isActive }) => `${LINK_BASE_CLASSES} ${isActive ? LINK_ACTIVE_CLASSES : ''}`}
          >
            <span aria-hidden="true">{item.icon}</span>
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      {promoSlot && <div className="mt-auto">{promoSlot}</div>}

      <div className={`flex flex-col gap-1 border-t border-border pt-3 ${promoSlot ? '' : 'mt-auto'}`}>
        <NavLink
          to="/configuracoes"
          onClick={onNavigate}
          className={({ isActive }) =>
            `flex items-center gap-2 rounded-lg px-4 py-2 text-style-label-lg text-text-h no-underline transition-colors duration-150 hover:bg-bg-subtle ${
              isActive ? LINK_ACTIVE_CLASSES : ''
            }`
          }
        >
          <span aria-hidden="true">⚙️</span>
          Configurações
        </NavLink>

        <div className="flex flex-col gap-0.5 pt-1">
          <NavLink
            to="/ajuda"
            onClick={onNavigate}
            className="px-4 py-1 text-style-label-sm text-text-muted no-underline hover:text-text-h"
          >
            Ajuda
          </NavLink>
          <NavLink
            to="/termos-de-uso"
            onClick={onNavigate}
            className="px-4 py-1 text-style-label-sm text-text-muted no-underline hover:text-text-h"
          >
            Termos de Uso
          </NavLink>
          <NavLink
            to="/privacidade"
            onClick={onNavigate}
            className="px-4 py-1 text-style-label-sm text-text-muted no-underline hover:text-text-h"
          >
            Privacidade
          </NavLink>
        </div>

        <p className="px-4 pt-2 text-style-label-sm text-text-muted">© 2026 Guardião Pomodoro — Saulo Guerreiro</p>
      </div>
    </>
  )
}

export function AppShell() {
  const { user, logout } = useAuth()
  const { guest, clearGuestData } = useGuest()
  const timer = useTimerContext()
  const { progress } = timer
  const { settings } = useSettings()
  const navigate = useNavigate()
  const location = useLocation()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isLogoutDialogOpen, setIsLogoutDialogOpen] = useState(false)
  const [isSwitchPersonDialogOpen, setIsSwitchPersonDialogOpen] = useState(false)

  // "Foco ativo" (Tweaks) força a prévia do esmaecimento; uma sessão de foco de verdade já em
  // andamento esmaece sozinha, sem precisar do toggle manual.
  const isPromoDimmed = (timer.type === 'foco' && timer.phase === 'rodando') || settings.promoFocusPreview

  // Conta tem precedência sobre um perfil guest residual (mesma regra de `DataSourceContext`) — evita
  // mostrar o nome do guest antigo para quem já fez upgrade para conta.
  const isAccount = Boolean(user)
  // Sem identidade nenhuma (modal de boas-vindas pedindo o nome ainda aberto), mostra um placeholder:
  // `ProtectedRoute` já renderiza o shell por trás do modal, de propósito, para a pessoa ver a tela de
  // onde vai cair assim que informar o nome — não é um estado "quebrado" a esconder com `return null`.
  const displayName = user?.name ?? guest?.name ?? 'Visitante'

  const isTimerRunning = timer.phase !== 'parado'
  const isOnTimerPage = location.pathname === '/timer'
  const firstName = displayName.trim().split(/\s+/)[0] ?? displayName

  // Fecha o menu hambúrguer sozinho ao trocar de rota (ex.: clicar num link do próprio menu).
  useEffect(() => {
    setIsMenuOpen(false)
  }, [location.pathname])

  // Enquanto o menu está aberto: Escape fecha e o scroll do body trava (o painel já rola sozinho).
  useEffect(() => {
    if (!isMenuOpen) return

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') setIsMenuOpen(false)
    }

    document.addEventListener('keydown', handleKeyDown)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = ''
    }
  }, [isMenuOpen])

  function handleLogout() {
    setIsLogoutDialogOpen(true)
  }

  function confirmLogout() {
    setIsLogoutDialogOpen(false)
    logout()
    // Sem isso, um perfil guest residual no localStorage (como quase todo mundo começa, antes de criar
    // conta) faria o header cair pro nome/avatar dele assim que `user` virasse `null` — dando a
    // impressão de que o logout não fez nada.
    clearGuestData()
    // `/timer` é a rota padrão do app; sem `user` nem `guest`, `ProtectedRoute` mostra o `WelcomeModal`
    // de novo sozinho — "começar do zero" pedindo nome ou login, sem precisar de uma rota especial.
    navigate('/timer', { replace: true })
  }

  function handleSwitchPerson() {
    setIsSwitchPersonDialogOpen(true)
  }

  function confirmSwitchPerson() {
    setIsSwitchPersonDialogOpen(false)
    clearGuestData()
    navigate('/timer', { replace: true })
  }

  return (
    <div className="flex min-h-svh w-full flex-col lg:flex-row">
      <aside className="hidden lg:sticky lg:top-0 lg:z-auto lg:flex lg:h-svh lg:w-[280px] lg:flex-col lg:gap-4 lg:border-r lg:border-border lg:bg-surface lg:p-4">
        <SidebarContent
          displayName={displayName}
          isAccount={isAccount}
          progress={progress}
          onLogout={handleLogout}
          promoSlot={<PromoCard secondsPerAd={settings.promoSecondsPerAd} isDimmed={isPromoDimmed} />}
        />
      </aside>

      {isMenuOpen && (
        <div className="fixed inset-0 z-30 lg:hidden">
          <div
            data-testid="menu-backdrop"
            className="absolute inset-0 bg-[rgba(46,36,61,0.45)]"
            onClick={() => setIsMenuOpen(false)}
            aria-hidden="true"
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Menu"
            className="absolute inset-y-0 left-0 flex w-[280px] max-w-[85vw] flex-col gap-4 overflow-y-auto bg-surface p-4 shadow-popover"
          >
            <div className="flex items-center justify-between">
              <span className="text-style-headline-sm text-text-h">Menu</span>
              <button
                type="button"
                onClick={() => setIsMenuOpen(false)}
                className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full border border-border bg-surface"
                aria-label="Fechar menu"
              >
                ✕
              </button>
            </div>

            <SidebarContent
              displayName={displayName}
              isAccount={isAccount}
              progress={progress}
              onLogout={handleLogout}
              onAccessAccount={() => navigate('/login')}
              onNavigate={() => setIsMenuOpen(false)}
            />
          </div>
        </div>
      )}

      {/* `pb-[160px]`/`lg:pb-[88px]` reservam a altura real da `LofiPlayerBar` fixa no rodapé desta
          coluna (mais a `PromoBar` empilhada acima dela, só no mobile) — mesmo número usado no `left`
          do bloco fixo do player mais abaixo. A sidebar não precisa desse ajuste: a barra do player só
          cobre a largura desta coluna (`lg:left-[280px]`), nunca passa por baixo da sidebar. */}
      <div className="flex min-w-0 flex-1 flex-col pb-[160px] lg:pb-[88px]">
        <header className="sticky top-0 z-10 flex items-center justify-between gap-4 border-b border-border bg-surface px-4 py-3 lg:px-6 lg:py-4">
          <div className="flex min-w-0 items-center gap-3">
            <button
              type="button"
              onClick={() => setIsMenuOpen(true)}
              className="flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-full border border-border bg-surface text-[18px] lg:hidden"
              aria-label="Abrir menu"
            >
              ☰
            </button>

            <div className="flex min-w-0 flex-col gap-1">
              <p className="text-style-label-lg text-text-h lg:hidden">Guardião Pomodoro</p>
              <p className="hidden overflow-hidden text-ellipsis whitespace-nowrap text-style-label-lg text-text-h lg:block lg:text-style-headline-sm">
                Olá, {firstName}! Vamos florescer hoje? 🌱
              </p>
              {progress && (
                <div className="hidden flex-wrap items-center gap-2 lg:flex">
                  <Badge variant={progress.streakDays > 0 ? 'highlight' : 'neutral'}>
                    🔥 {streakLabel(progress.streakDays)}
                  </Badge>
                  {progress.todayFocusCount > 0 && (
                    <Badge variant="primary">
                      🍅 {pluralizeCount(progress.todayFocusCount, 'pomodoro')} ({formatHoursAndMinutes(progress.todayFocusSeconds)})
                    </Badge>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            {!isOnTimerPage && isTimerRunning && (
              <span className="whitespace-nowrap rounded-full bg-primary-bg px-2 py-1.5 text-style-label-md text-primary-dark">
                {SESSION_LABELS[timer.type]} {formatMMSS(timer.remainingSeconds)}
              </span>
            )}
            {!isAccount && (
              <div className="hidden lg:block">
                <Button onClick={() => navigate('/login')}>Acessar minha conta</Button>
              </div>
            )}
            <EventsBell />
            <ThemeToggle />
            {isAccount ? (
              <ProfileMenu firstName={firstName} onLogout={handleLogout} />
            ) : (
              <VisitorMenu firstName={firstName} onSwitchPerson={handleSwitchPerson} />
            )}
          </div>
        </header>

        <main className="flex-1 p-4 lg:p-6">
          <Outlet />
        </main>
      </div>

      {/* `lg:left-[280px]` (largura da sidebar) impede a barra de passar por baixo dela no desktop —
          fica só na largura da coluna de conteúdo, como pedido ("não ocupar 100% da tela"). */}
      <div className="fixed inset-x-0 bottom-0 z-20 flex flex-col bg-surface lg:left-[280px]">
        <div className="lg:hidden">
          <PromoBar secondsPerAd={settings.promoSecondsPerAd} isDimmed={isPromoDimmed} />
        </div>
        <LofiPlayerBar />
      </div>

      {isLogoutDialogOpen && (
        <Dialog titleText="Sair da sua conta?" onDismiss={() => setIsLogoutDialogOpen(false)}>
          <p className="text-style-body-sm text-text-muted">
            {isTimerRunning
              ? 'Há um período em andamento. Ele será perdido ao sair.'
              : 'Você pode entrar novamente quando quiser.'}
          </p>
          <div className="mt-4 flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setIsLogoutDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={confirmLogout}>Sair</Button>
          </div>
        </Dialog>
      )}

      {isSwitchPersonDialogOpen && (
        <Dialog titleText="Trocar de pessoa neste dispositivo?" onDismiss={() => setIsSwitchPersonDialogOpen(false)}>
          <p className="text-style-body-sm text-text-muted">
            Isso apaga as tarefas, sessões e conquistas salvas aqui como visitante — não há como recuperar depois. A
            próxima pessoa começa do zero.
          </p>
          <div className="mt-4 flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setIsSwitchPersonDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={confirmSwitchPerson}>Trocar de pessoa</Button>
          </div>
        </Dialog>
      )}
    </div>
  )
}
