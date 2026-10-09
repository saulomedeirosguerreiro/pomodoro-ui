import { useEffect } from 'react'
import { Navigate, Outlet, Route, Routes, useLocation } from 'react-router-dom'
import { AppShell } from './components/common/AppShell'
import { ProtectedRoute } from './components/common/ProtectedRoute'
import { PublicOnlyRoute } from './components/common/PublicOnlyRoute'
import { AuthProvider } from './context/AuthContext'
import { DataSourceProvider } from './context/DataSourceContext'
import { FlexibleTimerProvider } from './context/FlexibleTimerContext'
import { GuestProvider } from './context/GuestContext'
import { LofiPlayerProvider } from './context/LofiPlayerContext'
import { SessionRegistrationProvider } from './context/SessionRegistrationContext'
import { SettingsProvider, useSettings } from './context/SettingsContext'
import { ThemeProvider } from './context/ThemeContext'
import { TimerProvider } from './context/TimerContext'
import { setAnalyticsEnabled, trackPageView } from './lib/analytics'
import { AjudaPage } from './routes/AjudaPage'
import { ConfiguracoesPage } from './routes/ConfiguracoesPage'
import { ConquistasPage } from './routes/ConquistasPage'
import { ForgotPasswordPage } from './routes/ForgotPasswordPage'
import { JardimPage } from './routes/JardimPage'
import { LoginPage } from './routes/LoginPage'
import { PoliticaDePrivacidadePage } from './routes/PoliticaDePrivacidadePage'
import { RegisterPage } from './routes/RegisterPage'
import { TarefasPage } from './routes/TarefasPage'
import { TermosDeUsoPage } from './routes/TermosDeUsoPage'
import { TimerPage } from './routes/TimerPage'
import { TweaksPage } from './routes/TweaksPage'

/**
 * Liga/desliga o envio ao GA4 conforme a preferência (opt-out em Configurações, ligado por padrão —
 * `src/lib/analytics.ts` só efetivamente carrega o script se `VITE_GA_MEASUREMENT_ID` existir) e
 * dispara `page_view` manual a cada troca de rota — o `gtag.js` padrão só mede o carregamento
 * inicial, não a navegação client-side de uma SPA.
 */
function AnalyticsBootstrap() {
  const { settings } = useSettings()
  const location = useLocation()

  useEffect(() => {
    setAnalyticsEnabled(settings.analyticsEnabled)
  }, [settings.analyticsEnabled])

  useEffect(() => {
    trackPageView(location.pathname)
  }, [location.pathname])

  return null
}

function TimerScope() {
  return (
    <SessionRegistrationProvider>
      <TimerProvider>
        <FlexibleTimerProvider>
          <LofiPlayerProvider>
            <Outlet />
          </LofiPlayerProvider>
        </FlexibleTimerProvider>
      </TimerProvider>
    </SessionRegistrationProvider>
  )
}

export default function App() {
  return (
    <ThemeProvider>
      <SettingsProvider>
        <AnalyticsBootstrap />
        <AuthProvider>
          <GuestProvider>
            <DataSourceProvider>
              <Routes>
                <Route element={<PublicOnlyRoute />}>
                  <Route path="/login" element={<LoginPage />} />
                  <Route path="/cadastro" element={<RegisterPage />} />
                  <Route path="/esqueci-minha-senha" element={<ForgotPasswordPage />} />
                </Route>

                <Route element={<ProtectedRoute />}>
                  <Route element={<TimerScope />}>
                    <Route element={<AppShell />}>
                      <Route path="/timer" element={<TimerPage />} />
                      <Route path="/tarefas" element={<TarefasPage />} />
                      <Route path="/jardim" element={<JardimPage />} />
                      <Route path="/conquistas" element={<ConquistasPage />} />
                      <Route path="/configuracoes" element={<ConfiguracoesPage />} />
                      <Route path="/tweaks" element={<TweaksPage />} />
                      <Route path="/ajuda" element={<AjudaPage />} />
                    </Route>
                  </Route>
                </Route>

                <Route path="/termos-de-uso" element={<TermosDeUsoPage />} />
                <Route path="/privacidade" element={<PoliticaDePrivacidadePage />} />

                <Route path="/dashboard" element={<Navigate to="/timer" replace />} />
                <Route path="/" element={<Navigate to="/timer" replace />} />
                <Route path="*" element={<Navigate to="/timer" replace />} />
              </Routes>
            </DataSourceProvider>
          </GuestProvider>
        </AuthProvider>
      </SettingsProvider>
    </ThemeProvider>
  )
}
