import { Navigate, Outlet, Route, Routes } from 'react-router-dom'
import { AppShell } from './components/common/AppShell'
import { ProtectedRoute } from './components/common/ProtectedRoute'
import { PublicOnlyRoute } from './components/common/PublicOnlyRoute'
import { AuthProvider } from './context/AuthContext'
import { DataSourceProvider } from './context/DataSourceContext'
import { FlexibleTimerProvider } from './context/FlexibleTimerContext'
import { GuestProvider } from './context/GuestContext'
import { SessionRegistrationProvider } from './context/SessionRegistrationContext'
import { SettingsProvider } from './context/SettingsContext'
import { ThemeProvider } from './context/ThemeContext'
import { TimerProvider } from './context/TimerContext'
import { AjudaPage } from './routes/AjudaPage'
import { ConfiguracoesPage } from './routes/ConfiguracoesPage'
import { ConquistasPage } from './routes/ConquistasPage'
import { ForgotPasswordPage } from './routes/ForgotPasswordPage'
import { JardimPage } from './routes/JardimPage'
import { LoginPage } from './routes/LoginPage'
import { RegisterPage } from './routes/RegisterPage'
import { TarefasPage } from './routes/TarefasPage'
import { TimerPage } from './routes/TimerPage'

function TimerScope() {
  return (
    <SessionRegistrationProvider>
      <TimerProvider>
        <FlexibleTimerProvider>
          <Outlet />
        </FlexibleTimerProvider>
      </TimerProvider>
    </SessionRegistrationProvider>
  )
}

export default function App() {
  return (
    <ThemeProvider>
      <SettingsProvider>
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
                      <Route path="/ajuda" element={<AjudaPage />} />
                    </Route>
                  </Route>
                </Route>

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
