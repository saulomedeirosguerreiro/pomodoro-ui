import type { TFunction } from 'i18next'
import type { SessionType } from '../types/api'

/** Valores de fábrica — ponto de partida de `DEFAULT_SETTINGS` e alvo do "Restaurar padrões". */
export const DEFAULT_SESSION_DURATIONS_SECONDS: Record<SessionType, number> = {
  foco: 25 * 60,
  descanso_curto: 5 * 60,
  descanso_longo: 15 * 60,
}

export function sessionLabel(t: TFunction, type: SessionType): string {
  return t(`timer:session.${type}`)
}

export const FOCI_PER_LONG_BREAK = 4

/**
 * Faixas min/max do modo "Time Blocking Flexível" (Parte 1, D-Q...): espelham
 * `SessionTypeDurations` do backend (Foco 5–120min, DescansoCurto 1–30min, DescansoLongo 5–60min) —
 * aqui simplificadas para uma única faixa de pausa (1–60min), já que `flexibleBreakSessionType`
 * decide o `SessionType` real a partir da duração escolhida.
 */
export const FLEXIBLE_FOCUS_MIN_MINUTES = 5
export const FLEXIBLE_FOCUS_MAX_MINUTES = 120
export const FLEXIBLE_BREAK_MIN_MINUTES = 1
export const FLEXIBLE_BREAK_MAX_MINUTES = 60

export const FLEXIBLE_FOCUS_PRESETS_MINUTES = [5, 10, 15, 25, 30, 45, 60] as const
export const FLEXIBLE_BREAK_PRESETS_MINUTES = [5, 10, 15, 20] as const

/**
 * Faixa min/max por tipo (em minutos), espelhando `SessionTypeDurations` do backend 1:1 (ao
 * contrário de `FLEXIBLE_BREAK_MIN/MAX_MINUTES`, que são uma faixa única simplificada p/ a UI de
 * escolha de duração). Usado para explicar ao usuário por que um bloco ficou fora da faixa
 * permitida (ex.: "Encerrar agora" poucos segundos após iniciar).
 */
export const SESSION_DURATION_RANGE_MINUTES: Record<SessionType, { min: number; max: number }> = {
  foco: { min: 5, max: 120 },
  descanso_curto: { min: 1, max: 30 },
  descanso_longo: { min: 5, max: 60 },
}

/** Converte os 3 campos de duração das Settings (minutos) no mapa de segundos por tipo que o timer consome. */
export function sessionDurationsSecondsFrom(
  focusMinutes: number,
  shortBreakMinutes: number,
  longBreakMinutes: number,
): Record<SessionType, number> {
  return {
    foco: focusMinutes * 60,
    descanso_curto: shortBreakMinutes * 60,
    descanso_longo: longBreakMinutes * 60,
  }
}

/**
 * Espelha Pomodoro.Domain.Services.PomodoroCycleAdvisor do backend (US-12 RN-02, D-Q5). USO
 * RESTRITO a uma conclusão DE VERDADE: `totalFociCompletedSoFar` tem que já estar incrementado pra
 * contar o foco que acabou de terminar (ver o handler de conclusão natural em `useTimer.ts`, que
 * soma +1 antes de chamar). Nunca chamar com o total "cru" (não incrementado) pra prever o próximo
 * tipo sem ter concluído nada — ver `predictedNextType` pra esse caso.
 */
export function nextSuggestedType(completedType: SessionType, totalFociCompletedSoFar: number): SessionType {
  if (completedType !== 'foco') {
    return 'foco'
  }

  const isFourthFocusInCycle = totalFociCompletedSoFar > 0 && totalFociCompletedSoFar % FOCI_PER_LONG_BREAK === 0
  return isFourthFocusInCycle ? 'descanso_longo' : 'descanso_curto'
}

/**
 * Prevê o "próximo tipo" SEM contar a sessão atual como concluída — usado por "Pular" (US-34) e
 * pelo `ModeSwitcher` pra travar a troca manual ANTES de o foco atual sequer começar/terminar
 * (US-33b). Diferente de `nextSuggestedType`, nunca sugere `descanso_longo`: a pausa longa só é
 * ganha de verdade completando o 4º foco (via `nextSuggestedType` com o total já incrementado) —
 * prever a partir do total NÃO incrementado não pode usar o mesmo `% 4 === 0`, senão um foco recém
 * iniciado de um ciclo novo (total global já múltiplo de 4 por causa de ciclos anteriores,
 * `cycleFocusCount` voltando a 0) seria erradamente marcado como já merecendo outra pausa longa.
 */
export function predictedNextType(completedType: SessionType): SessionType {
  return completedType === 'foco' ? 'descanso_curto' : 'foco'
}

/**
 * "Ciclo N de 4" (US-36, G-Q5b): quantos focos já foram concluídos no ciclo atual (0–3). Antes
 * (`computeCycleCount`) contava a partir de uma janela de até 10 sessões buscadas do histórico,
 * parando ao achar uma pausa longa concluída — divergia de `nextSuggestedType` (que decide a trava
 * de sequência a partir do total GLOBAL) sempre que o histórico tinha mais de 10 itens desde a
 * última pausa longa de verdade (ex.: muita sessão interrompida/pulada no meio). Agora deriva do
 * MESMO contador global (`totalFociCompletedSoFar`), então os dois nunca mais destoam.
 */
export function cycleFocusCount(totalFociCompletedSoFar: number): number {
  return totalFociCompletedSoFar % FOCI_PER_LONG_BREAK
}

export function formatMMSS(totalSeconds: number): string {
  const safeSeconds = Math.max(0, Math.round(totalSeconds))
  const minutes = Math.floor(safeSeconds / 60)
  const seconds = safeSeconds % 60
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
}

/**
 * Tempo restante calculado pelo relógio real (RNF-08, US-08 RN-02) — sobrevive a aba em segundo
 * plano. Extraída de `useTimer` para ser reusada por `useFlexibleTimer` sem duplicar a conta.
 */
export function computeRemainingSeconds(
  totalSeconds: number,
  startedAtMs: number,
  pausedAccumulatedMs: number,
  now: number,
): number {
  const elapsedMs = now - startedAtMs - pausedAccumulatedMs
  return Math.max(0, totalSeconds - elapsedMs / 1000)
}

/**
 * Decide o `SessionType` de uma pausa do modo flexível a partir da duração escolhida (minutos):
 * `<= 30` → `descanso_curto`, senão `descanso_longo`. Cobre 1–60min sem buraco, dado que
 * DescansoLongo aceita a partir de 5min no backend e só é escolhido aqui a partir de 31min.
 */
export function flexibleBreakSessionType(minutes: number): SessionType {
  return minutes <= 30 ? 'descanso_curto' : 'descanso_longo'
}
