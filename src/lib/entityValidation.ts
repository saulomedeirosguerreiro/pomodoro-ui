import type { FieldError, SessionType, TaskItem } from '../types/api'
import type { TaskPayload } from './tasksService'
import {
  DEFAULT_SESSION_DURATIONS_SECONDS,
  FLEXIBLE_BREAK_MAX_MINUTES,
  FLEXIBLE_BREAK_MIN_MINUTES,
  FLEXIBLE_FOCUS_MAX_MINUTES,
  FLEXIBLE_FOCUS_MIN_MINUTES,
} from './timerLogic'

/**
 * Espelha os invariantes de `TaskItem` (C#, `Pomodoro.Domain.Entities.TaskItem`) e de
 * `CreatePomodoroValidator` — título, descrição, estimativa, duração por tipo e vínculo tarefa<->sessão.
 */

const TITLE_MIN_LENGTH = 1
const TITLE_MAX_LENGTH = 120
const DESCRIPTION_MAX_LENGTH = 500
const MIN_ESTIMATED_POMODOROS = 1
const MAX_ESTIMATED_POMODOROS = 20
const DURATION_TOLERANCE_SECONDS = 60

/**
 * title 1-120, description até 500 (ou null), estimatedPomodoros 1-20. Retorna `FieldError[]`
 * (types/api.ts), vazio se ok.
 *
 * Detalhe replicado ao pé da letra do domínio C# (`TaskItem.ValidateTitle`/`ValidateDescription`):
 * o título é validado JÁ TRIMADO (espaços nas pontas não contam), mas a descrição é validada SEM
 * trim — um título "   " conta como vazio, mas uma descrição com 500 caracteres de espaço nas
 * pontas conta no limite de 500 do jeito que está, sem trim.
 */
export function validateTaskPayload(payload: TaskPayload): FieldError[] {
  const errors: FieldError[] = []
  const trimmedTitleLength = payload.title.trim().length

  if (trimmedTitleLength < TITLE_MIN_LENGTH || trimmedTitleLength > TITLE_MAX_LENGTH) {
    errors.push({
      field: 'title',
      message: `Título deve ter entre ${TITLE_MIN_LENGTH} e ${TITLE_MAX_LENGTH} caracteres.`,
    })
  }

  if (payload.description !== null && payload.description.length > DESCRIPTION_MAX_LENGTH) {
    errors.push({
      field: 'description',
      message: `Descrição deve ter no máximo ${DESCRIPTION_MAX_LENGTH} caracteres.`,
    })
  }

  if (payload.estimatedPomodoros < MIN_ESTIMATED_POMODOROS || payload.estimatedPomodoros > MAX_ESTIMATED_POMODOROS) {
    errors.push({
      field: 'estimatedPomodoros',
      message: `Estimativa de pomodoros deve ser entre ${MIN_ESTIMATED_POMODOROS} e ${MAX_ESTIMATED_POMODOROS}.`,
    })
  }

  return errors
}

/**
 * Duração dentro de tolerância por tipo: `expectedSeconds + 60s` no máximo (status concluído).
 * `expectedSeconds` é a duração configurada pelo usuário pra esse tipo (default: valor de
 * fábrica) — só há tolerância para CIMA do esperado — o único piso é `duration > 0` (não há
 * tolerância para baixo). Mesma regra do backend (`CreatePomodoroValidator`/
 * `SessionTypeDurations`), que aceita uma faixa alargada por tipo em vez do padrão fixo.
 */
export function isDurationWithinTolerance(
  type: SessionType,
  durationSeconds: number,
  expectedSeconds: number = DEFAULT_SESSION_DURATIONS_SECONDS[type],
): boolean {
  if (durationSeconds <= 0) {
    return false
  }
  return durationSeconds <= expectedSeconds + DURATION_TOLERANCE_SECONDS
}

/**
 * Duração dentro da faixa min/max real do modo "Time Blocking Flexível" — espelha
 * `SessionTypeDurations` do backend (Foco 5–120min, pausas 1–60min via `flexibleBreakSessionType`).
 * Validação nova e separada de `isDurationWithinTolerance` (modelo antigo, só para o modo clássico):
 * aqui não há tolerância, é a própria faixa escolhida pela pessoa na tela de seleção de duração.
 */
export function isDurationWithinFlexibleRange(type: SessionType, durationSeconds: number): boolean {
  const [minMinutes, maxMinutes] =
    type === 'foco'
      ? [FLEXIBLE_FOCUS_MIN_MINUTES, FLEXIBLE_FOCUS_MAX_MINUTES]
      : [FLEXIBLE_BREAK_MIN_MINUTES, FLEXIBLE_BREAK_MAX_MINUTES]

  return durationSeconds >= minMinutes * 60 && durationSeconds <= maxMinutes * 60
}

/** `completedAt >= startedAt`, replicando `CreatePomodoroValidator`. */
export function isCompletedAtValid(startedAt: string, completedAt: string): boolean {
  return new Date(completedAt).getTime() >= new Date(startedAt).getTime()
}

/**
 * Vínculo tarefa<->sessão: só `foco`, e só se a tarefa não estiver `feito`. Replica
 * `CreatePomodoroHandler.EnsureTaskCanBeLinkedAsync` (sem tarefa = sem vínculo possível).
 */
export function canLinkTaskToSession(task: TaskItem | null, sessionType: SessionType): boolean {
  if (task === null) {
    return false
  }
  return sessionType === 'foco' && task.status !== 'feito'
}
