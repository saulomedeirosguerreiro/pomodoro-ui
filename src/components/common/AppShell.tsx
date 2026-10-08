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
import styles from './AppShell.module.css'

const NAV_ITEMS = [
  { to: '/timer', label: 'Timer', icon: '⏱️' },
  { to: '/tarefas', label: 'Tarefas', icon: '✅' },
  { to: '/jardim', label: 'Jardim de Foco', icon: '🌱' },
  { to: '/conquistas', label: 'Conquistas', icon: '🏆' },
]

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
  const displayName = user?.name ?? guest?.name ?? null

  if (!displayName) {
    return null
  }

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
    <div className={styles.shell}>
      <aside className={styles.nav}>
        <div className={styles.brand}>
          <span className={styles.brandIcon} aria-hidden="true">
            🍅
          </span>
          <div>
            <p className={styles.brandName}>PomoGarden</p>
            <p className={styles.brandTagline}>Horta em Crescimento</p>
          </div>
        </div>

        <div className={styles.profileCard}>
          <p className={styles.profileName}>{displayName}</p>
          {isAccount && user && <p className={styles.profileEmail}>{user.email}</p>}
          {progress && (
            <>
              <p className={styles.profileLevel}>
                Nível {progress.level} • {progress.title}
              </p>
              <div className={styles.xpRow}>
                <ProgressBar value={progress.xpInLevel} max={progress.xpForNextLevel} />
                <span className={styles.xpLabel}>
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

        <nav className={styles.links} aria-label="Navegação principal">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => `${styles.link} ${isActive ? styles.linkActive : ''}`}
            >
              <span aria-hidden="true">{item.icon}</span>
              <span className={styles.linkLabel}>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <Button fullWidth onClick={handleStartSession} disabled={isTimerRunning}>
          🌱 Plantar Foco
        </Button>

        <div className={styles.footerLinks}>
          <NavLink to="/configuracoes" className={styles.footerLink}>
            Configurações
          </NavLink>
          <NavLink to="/ajuda" className={styles.footerLink}>
            Ajuda
          </NavLink>
        </div>
      </aside>

      <div className={styles.content}>
        <header className={styles.topbar}>
          <div className={styles.greetingGroup}>
            <p className={styles.greeting}>Olá, {firstName}! Vamos florescer hoje? 🌱</p>
            {progress && (
              <div className={styles.statsPills}>
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

          <div className={styles.topbarActions}>
            {!isOnTimerPage && isTimerRunning && (
              <span className={styles.timerIndicator}>
                {SESSION_LABELS[timer.type]} {formatMMSS(timer.remainingSeconds)}
              </span>
            )}
            <div className={styles.ambientSlot}>
              <AmbientPlayer />
            </div>
            <Button className={styles.startButton} onClick={handleStartSession} disabled={isTimerRunning}>
              Iniciar Sessão
            </Button>
            <EventsBell />
            <div className={styles.avatar} aria-hidden="true">
              {firstName.charAt(0).toUpperCase()}
            </div>
          </div>
        </header>

        <main className={styles.main}>
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
