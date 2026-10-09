export type SessionType = 'foco' | 'descanso_curto' | 'descanso_longo'
export type SessionStatus = 'concluido' | 'interrompido'

export interface UserSummary {
  id: number
  name: string
  email: string
}

export interface UserProfile extends UserSummary {
  completedSessions: number
}

export interface PomodoroSession {
  id: number
  type: SessionType
  status: SessionStatus
  durationSeconds: number
  startedAt: string
  completedAt: string
  createdAt: string
  /**
   * Vínculo opcional com a tarefa em foco no momento da sessão. Aditivo (Frente 2 do modo sem conta):
   * já existia em `CreateSessionPayload`, mas não na entidade retornada — o backend remoto ainda não
   * popula este campo hoje; quando passar a devolver, plugamos sem mudar o tipo de novo. Sem isso,
   * `localDataSource.listTasks` não consegue computar `TaskItem.completedPomodoros` em leitura.
   */
  taskId?: number | null
  /** Metadados de origem do modo "Time Blocking Flexível" — `null`/ausente para o modo clássico. */
  mode?: 'flexivel' | null
  /** Duração planejada do bloco (antes de qualquer "+tempo"), em segundos. Só preenchido no modo flexível. */
  plannedDurationSeconds?: number | null
  /** Segundos adicionados via "+tempo" durante o bloco. Só preenchido no modo flexível. */
  addedSeconds?: number | null
}

export interface PagedResult<T> {
  items: T[]
  totalCount: number
  limit: number
  offset: number
}

export interface LoginResponse {
  token: string
  user: UserSummary
}

export interface ProgressSummary {
  level: number
  title: string
  xpInLevel: number
  xpForNextLevel: number
  totalXp: number
  seeds: number
  streakDays: number
  isStreakAtRiskToday: boolean
  todayFocusCount: number
  todayFocusSeconds: number
}

export type TaskPriority = 'baixa' | 'media' | 'alta'
export type TaskItemStatus = 'a_fazer' | 'em_curso' | 'feito'

export interface TaskItem {
  id: number
  title: string
  description: string | null
  priority: TaskPriority
  estimatedPomodoros: number
  completedPomodoros: number
  status: TaskItemStatus
  createdAt: string
  updatedAt: string
}

export interface Achievement {
  code: string
  name: string
  description: string
  unlockedAt: string | null
  progressCurrent: number | null
  progressTarget: number | null
}

export interface FieldError {
  field: string
  message: string
}

export interface ApiErrorBody {
  code: string
  message: string
  fields?: FieldError[] | null
}

export class ApiError extends Error {
  readonly status: number
  readonly code: string
  readonly fields: FieldError[]

  constructor(status: number, body: ApiErrorBody) {
    super(body.message)
    this.status = status
    this.code = body.code
    this.fields = body.fields ?? []
  }

  fieldMessage(field: string): string | undefined {
    return this.fields.find((f) => f.field.toLowerCase() === field.toLowerCase())?.message
  }
}
