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
  notes: string | null
  createdAt: string
  updatedAt: string
  role?: string
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
}

export const dogsMethods = {
  async listDogs(this: ApiClient) {
    return this.request<{ success: boolean; data: DogRecord[] }>('/v1/dogs')
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
  }
}
