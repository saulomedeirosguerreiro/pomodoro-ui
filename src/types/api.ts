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
