import type { ApiClient } from '../api-client'

export type DailyCareActionStatus =
  | 'PENDING'
  | 'COMPLETED'
  | 'SKIPPED'
  | 'PARTIALLY_COMPLETED'
  | 'UNCLEAR'

export type Tolerance = 'GOOD' | 'OKAY' | 'POOR' | 'PAINFUL' | 'UNKNOWN'

export type VoiceNoteProcessingStatus = 'PENDING' | 'TRANSCRIBED' | 'PROCESSED' | 'FAILED'

export type HealthObservationType =
  | 'SLIPPING'
  | 'LIMPING'
  | 'WEAKNESS'
  | 'STIFFNESS'
  | 'PAIN'
  | 'LOW_ENERGY'
  | 'APPETITE'
  | 'BATHROOM'
  | 'MEDICATION'
  | 'GENERAL_NOTE'

export type CareActionCategory =
  | 'STRETCH'
  | 'STRENGTH'
  | 'MOBILITY'
  | 'WALK'
  | 'MEDICATION'
  | 'GENERAL_CARE'
  | 'OBSERVATION_CHECKPOINT'

export type CareActionFrequency = 'DAILY' | 'EVERY_OTHER_DAY' | 'WEEKLY' | 'AS_NEEDED'

export type CareActionTimeOfDay = 'MORNING' | 'EVENING' | 'ANYTIME'

export interface CareActionRecord {
  id: string
  carePlanId: string
  name: string
  description: string | null
  category: CareActionCategory
  frequency: CareActionFrequency
  timeOfDay: CareActionTimeOfDay | null
  targetReps: number | null
  targetDurationSeconds: number | null
  instructions: string | null
  sortOrder: number
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface CarePlanPayload {
  id: string
  dogId: string
  name: string
  isActive: boolean
  createdAt: string
  updatedAt: string
  actions: CareActionRecord[]
}

export interface CreateCareActionInput {
  name: string
  description?: string | null
  category: CareActionCategory
  frequency: CareActionFrequency
  timeOfDay?: CareActionTimeOfDay | null
  targetReps?: number | null
  targetDurationSeconds?: number | null
  instructions?: string | null
  sortOrder?: number
}

export interface UpdateCareActionInput extends Partial<CreateCareActionInput> {}

export interface CalendarDaySummary {
  date: string
  completedCount: number
  totalActions: number
  hasLog: boolean
}

export interface CalendarPayload {
  month: string
  days: CalendarDaySummary[]
}

export interface UserSummary {
  id: string
  email: string
  firstName: string | null
  lastName: string | null
}

export interface DogRecord {
  id: string
  name: string
  breed: string | null
  age: number | null
  photoUrl: string | null
  notes: string | null
  createdAt: string
  updatedAt: string
  role?: string
  defaultCarePlan?: string
  shareCode?: string
}

export interface JoinPreview {
  id: string
  name: string
  breed: string | null
  photoUrl: string | null
}

export interface CreateDogInput {
  name: string
  breed?: string | null
  age?: number | null
  /** S3 object key from presigned upload */
  photoKey?: string | null
  notes?: string | null
}

export interface UpdateDogInput {
  name?: string
  breed?: string | null
  age?: number | null
  photoKey?: string | null
  notes?: string | null
}

export interface DailyCareActionRecord {
  id: string
  dailyCareLogId: string
  careActionId: string
  nameSnapshot: string
  categorySnapshot: string
  status: DailyCareActionStatus
  completedAt: string | null
  completedByUserId: string | null
  notes: string | null
  tolerance: Tolerance | null
  issueObserved: boolean
  completedBy: UserSummary | null
}

export interface VoiceNoteRecord {
  id: string
  dogId: string
  dailyCareLogId: string
  userId: string
  transcript: string
  processingStatus: VoiceNoteProcessingStatus
  extraction: unknown
  caregiverNote: string | null
  needsReview: boolean
  createdAt: string
  user: UserSummary
}

export interface HealthObservationRecord {
  id: string
  type: HealthObservationType
  severity: string | null
  bodyArea: string | null
  note: string
  observedAt: string | null
  createdAt: string
  user: UserSummary
}

export interface TodayPayload {
  dog: DogRecord
  date: string
  dailyLog: {
    id: string
    summary: string | null
    dailyCareActions: DailyCareActionRecord[]
    voiceNotes: VoiceNoteRecord[]
    healthObservations: HealthObservationRecord[]
  }
  progress: { completed: number; total: number }
}

export interface DogsApi {
  listDogs(): Promise<{ success: boolean; data: DogRecord[] }>
  createDog(input: CreateDogInput): Promise<{ success: boolean; data: DogRecord }>
  updateDog(dogId: string, input: UpdateDogInput): Promise<{ success: boolean; data: DogRecord }>
  getDog(dogId: string): Promise<{ success: boolean; data: DogRecord }>
  getToday(dogId: string, date?: string): Promise<{ success: boolean; data: TodayPayload }>
  getHistory(
    dogId: string,
    page?: number,
    limit?: number
  ): Promise<{
    success: boolean
    data: {
      logs: Array<{
        id: string
        date: string
        summary: string | null
        completedCount: number
        totalActions: number
        observationCount: number
        voiceNoteCount: number
      }>
      pagination: { page: number; limit: number; total: number; pages: number }
    }
  }>
  transcribeVoiceNote(
    dogId: string,
    file: Blob,
    options?: { date?: string; prompt?: string }
  ): Promise<{
    success: boolean
    data: TodayPayload & { text: string; voiceNote: VoiceNoteRecord }
  }>
  updateDailyAction(
    dogId: string,
    actionId: string,
    body: {
      status?: DailyCareActionStatus
      notes?: string
      tolerance?: Tolerance | null
      issueObserved?: boolean
    }
  ): Promise<{ success: boolean; data: DailyCareActionRecord }>
  addDogMember(dogId: string, userId: string, role?: string): Promise<{ success: boolean; data: unknown }>
  getCarePlan(dogId: string): Promise<{ success: boolean; data: CarePlanPayload }>
  updateCarePlan(dogId: string, name: string): Promise<{ success: boolean; data: CarePlanPayload }>
  createCareAction(
    dogId: string,
    input: CreateCareActionInput
  ): Promise<{ success: boolean; data: CareActionRecord }>
  updateCareAction(
    dogId: string,
    actionId: string,
    input: UpdateCareActionInput
  ): Promise<{ success: boolean; data: CareActionRecord }>
  deactivateCareAction(
    dogId: string,
    actionId: string
  ): Promise<{ success: boolean; data: CareActionRecord }>
  getCalendar(dogId: string, month: string): Promise<{ success: boolean; data: CalendarPayload }>
  previewJoin(code: string): Promise<{ success: boolean; data: JoinPreview }>
  joinByShareCode(shareCode: string): Promise<{ success: boolean; data: DogRecord; message?: string }>
}

export const dogsMethods = {
  async listDogs(this: ApiClient) {
    return this.request<{ success: boolean; data: DogRecord[] }>('/v1/dogs')
  },

  async createDog(this: ApiClient, input: CreateDogInput) {
    return this.request<{ success: boolean; data: DogRecord }>('/v1/dogs', {
      method: 'POST',
      data: input
    })
  },

  async updateDog(this: ApiClient, dogId: string, input: UpdateDogInput) {
    return this.request<{ success: boolean; data: DogRecord }>(`/v1/dogs/${dogId}`, {
      method: 'PATCH',
      data: input
    })
  },

  async getDog(this: ApiClient, dogId: string) {
    return this.request<{ success: boolean; data: DogRecord }>(`/v1/dogs/${dogId}`)
  },

  async getToday(this: ApiClient, dogId: string, date?: string) {
    const params = date ? `?date=${encodeURIComponent(date)}` : ''
    return this.request<{ success: boolean; data: TodayPayload }>(`/v1/dogs/${dogId}/today${params}`)
  },

  async getHistory(this: ApiClient, dogId: string, page = 1, limit = 20) {
    return this.request(`/v1/dogs/${dogId}/history?page=${page}&limit=${limit}`)
  },

  async transcribeVoiceNote(
    this: ApiClient,
    dogId: string,
    file: Blob,
    options?: { date?: string; prompt?: string }
  ) {
    const form = new FormData()
    form.append('file', file, 'recording.wav')
    const query = new URLSearchParams()
    if (options?.date) query.set('date', options.date)
    if (options?.prompt) query.set('prompt', options.prompt)
    const qs = query.toString()
    return this.request<{
      success: boolean
      data: TodayPayload & { text: string; voiceNote: VoiceNoteRecord }
    }>(`/v1/dogs/${dogId}/voice-notes/transcribe${qs ? `?${qs}` : ''}`, {
      method: 'POST',
      data: form
    })
  },

  async updateDailyAction(
    this: ApiClient,
    dogId: string,
    actionId: string,
    body: {
      status?: DailyCareActionStatus
      notes?: string
      tolerance?: Tolerance | null
      issueObserved?: boolean
    }
  ) {
    return this.request<{ success: boolean; data: DailyCareActionRecord }>(
      `/v1/dogs/${dogId}/daily-actions/${actionId}`,
      { method: 'PATCH', data: body }
    )
  },

  async addDogMember(this: ApiClient, dogId: string, userId: string, role?: string) {
    return this.request(`/v1/dogs/${dogId}/members`, {
      method: 'POST',
      data: { userId, role }
    })
  },

  async getCarePlan(this: ApiClient, dogId: string) {
    return this.request<{ success: boolean; data: CarePlanPayload }>(`/v1/dogs/${dogId}/care-plan`)
  },

  async updateCarePlan(this: ApiClient, dogId: string, name: string) {
    return this.request<{ success: boolean; data: CarePlanPayload }>(`/v1/dogs/${dogId}/care-plan`, {
      method: 'PATCH',
      data: { name }
    })
  },

  async createCareAction(this: ApiClient, dogId: string, input: CreateCareActionInput) {
    return this.request<{ success: boolean; data: CareActionRecord }>(
      `/v1/dogs/${dogId}/care-plan/actions`,
      { method: 'POST', data: input }
    )
  },

  async updateCareAction(
    this: ApiClient,
    dogId: string,
    actionId: string,
    input: UpdateCareActionInput
  ) {
    return this.request<{ success: boolean; data: CareActionRecord }>(
      `/v1/dogs/${dogId}/care-plan/actions/${actionId}`,
      { method: 'PATCH', data: input }
    )
  },

  async deactivateCareAction(this: ApiClient, dogId: string, actionId: string) {
    return this.request<{ success: boolean; data: CareActionRecord }>(
      `/v1/dogs/${dogId}/care-plan/actions/${actionId}/deactivate`,
      { method: 'PATCH' }
    )
  },

  async getCalendar(this: ApiClient, dogId: string, month: string) {
    return this.request<{ success: boolean; data: CalendarPayload }>(
      `/v1/dogs/${dogId}/calendar?month=${encodeURIComponent(month)}`
    )
  },

  async previewJoin(this: ApiClient, code: string) {
    const params = new URLSearchParams({ code })
    return this.request<{ success: boolean; data: JoinPreview }>(
      `/v1/dogs/join/preview?${params.toString()}`
    )
  },

  async joinByShareCode(this: ApiClient, shareCode: string) {
    return this.request<{ success: boolean; data: DogRecord; message?: string }>('/v1/dogs/join', {
      method: 'POST',
      data: { shareCode }
    })
  }
}
