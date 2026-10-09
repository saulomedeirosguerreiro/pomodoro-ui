import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useGuest } from '../../context/GuestContext'
import { useTimerContext } from '../../context/TimerContext'
import { formatHoursAndMinutes } from '../../lib/format'
import { formatMMSS, SESSION_LABELS } from '../../lib/timerLogic'
import { AmbientPlayer } from '../Sound/AmbientPlayer'
import { AchievementToastView } from './AchievementToastView'
import { Badge } from './Badge'
import { Button } from './Button'
import { EventsBell } from './EventsBell'
import { ProgressBar } from './ProgressBar'
import { RewardToastView } from './RewardToastView'
import { ThemeToggle } from './ThemeToggle'

const NAV_ITEMS = [
  { to: '/timer', label: 'Timer', icon: '⏱️' },
  { to: '/tarefas', label: 'Tarefas', icon: '✅' },
  { to: '/jardim', label: 'Jardim de Foco', icon: '🌱' },
  { to: '/conquistas', label: 'Conquistas', icon: '🏆' },
]

const LINK_BASE_CLASSES =
  'flex flex-col items-center gap-0.5 whitespace-nowrap rounded-lg px-4 py-2.5 text-center text-style-label-sm text-text-muted no-underline transition-colors duration-150 hover:bg-bg-subtle hover:text-text-h lg:flex-row lg:justify-start lg:text-left lg:text-style-label-lg'
const LINK_ACTIVE_CLASSES = 'bg-primary-bg text-primary-dark hover:bg-primary-bg hover:text-primary-dark'

export function AppShell() {
  const { user, logout } = useAuth()
  const { guest } = useGuest()
  const timer = useTimerContext()
  const { progress } = timer
  const navigate = useNavigate()
  const location = useLocation()

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

  function handleLogout() {
    if (isTimerRunning) {
      const confirmed = window.confirm('Há um período em andamento. Ele será perdido. Deseja mesmo sair?')
      if (!confirmed) return
    }
    logout()
  }

  function handleStartSession() {
    navigate('/timer')
    if (!isTimerRunning) {
      timer.start()
    }
  }

  return (
    <div className="flex min-h-svh w-full flex-col lg:flex-row">
      <aside className="fixed inset-x-0 bottom-0 z-20 flex w-full shrink-0 flex-row items-center gap-4 overflow-x-auto border-t border-border bg-surface p-2 lg:sticky lg:inset-x-auto lg:top-0 lg:bottom-auto lg:z-auto lg:h-svh lg:w-[280px] lg:flex-col lg:items-stretch lg:border-t-0 lg:border-r lg:p-4">
        <div className="hidden items-center gap-2 p-1 lg:flex">
          <span className="text-[28px]" aria-hidden="true">
            🍅
          </span>
          <div>
            <p className="text-style-headline-sm text-primary-dark">PomoGarden</p>
            <p className="text-style-label-sm text-secondary-dark">Horta em Crescimento</p>
          </div>
        </div>

        <div className="hidden flex-col gap-2 rounded-lg border border-border bg-bg-subtle p-4 lg:flex">
          <p className="overflow-hidden text-ellipsis whitespace-nowrap text-style-label-lg text-text-h">
            {displayName}
          </p>
          {isAccount && user && (
            <p className="overflow-hidden text-ellipsis whitespace-nowrap text-style-body-sm text-text-muted">
              {user.email}
            </p>
          )}
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
          {/* Guest não tem sessão de conta para encerrar — a saída deliberada (com confirmação) já
              existe em Configurações ("Apagar meus dados deste dispositivo"), não no nav bar. */}
          {isAccount && (
            <Button variant="ghost" fullWidth onClick={handleLogout}>
              Sair
            </Button>
          )}
        </div>

        <nav
          className="flex flex-row flex-1 gap-1 lg:flex-none lg:flex-col"
          aria-label="Navegação principal"
        >
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => `${LINK_BASE_CLASSES} ${isActive ? LINK_ACTIVE_CLASSES : ''}`}
            >
              <span aria-hidden="true">{item.icon}</span>
              <span className="flex-none lg:flex-1">{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="hidden lg:block">
          <Button fullWidth onClick={handleStartSession} disabled={isTimerRunning}>
            🌱 Plantar Foco
          </Button>
        </div>

        <div className="mt-auto hidden flex-col gap-0.5 border-t border-border pt-2 lg:flex">
          <NavLink
            to="/configuracoes"
            className="px-4 py-1 text-style-label-md text-text-muted no-underline hover:text-text-h"
          >
            Configurações
          </NavLink>
          <NavLink
            to="/ajuda"
            className="px-4 py-1 text-style-label-md text-text-muted no-underline hover:text-text-h"
          >
            Ajuda
          </NavLink>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col pb-[72px] lg:pb-0">
        <header className="sticky top-0 z-10 flex items-center justify-between gap-4 border-b border-border bg-surface px-6 py-4">
          <div className="flex min-w-0 flex-col gap-1">
            <p className="overflow-hidden text-ellipsis whitespace-nowrap text-style-label-lg text-text-h lg:text-style-headline-sm">
              Olá, {firstName}! Vamos florescer hoje? 🌱
            </p>
            {progress && (
              <div className="hidden flex-wrap items-center gap-2 sm:flex">
                <Badge variant={progress.streakDays > 0 ? 'highlight' : 'neutral'}>
                  🔥 {progress.streakDays > 0 ? `${progress.streakDays} dias seguidos` : 'Plante o 1º foco de hoje'}
                </Badge>
                {progress.todayFocusCount > 0 && (
                  <Badge variant="primary">
                    🍅 {progress.todayFocusCount} pomodoros ({formatHoursAndMinutes(progress.todayFocusSeconds)})
                  </Badge>
                )}
              </div>
            )}
          </div>

          <div className="flex shrink-0 items-center gap-2">
            {!isOnTimerPage && isTimerRunning && (
              <span className="whitespace-nowrap rounded-full bg-primary-bg px-2 py-1.5 text-style-label-md text-primary-dark">
                {SESSION_LABELS[timer.type]} {formatMMSS(timer.remainingSeconds)}
              </span>
            )}
            <div className="hidden sm:block">
              <AmbientPlayer />
            </div>
            <div className="hidden sm:block">
              <Button onClick={handleStartSession} disabled={isTimerRunning}>
                Iniciar Sessão
              </Button>
            </div>
            <EventsBell />
            <ThemeToggle />
            <div
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-tertiary text-style-label-md text-on-primary"
              aria-hidden="true"
            >
              {firstName.charAt(0).toUpperCase()}
            </div>
          </div>
        </header>

        <main className="flex-1 p-6">
          <Outlet />
        </main>
      </div>

      {timer.rewardToast && <RewardToastView toast={timer.rewardToast} onDismiss={timer.dismissRewardToast} />}
      {timer.achievementToast && (
        <AchievementToastView achievement={timer.achievementToast} onDismiss={timer.dismissAchievementToast} />
      )}
    </div>
  )
}
