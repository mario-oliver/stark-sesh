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
  | 'GENERAL_NOTE'

export type ObservationSeverity = 'MILD' | 'MODERATE' | 'SEVERE' | 'UNKNOWN'

// Bucket is the ONLY categorization (ADR-0002). There is no second `category` taxonomy.
export type CareBucket = 'ACTIVITY' | 'MOBILITY' | 'RECOVERY'

export type DailyCareActionSource = 'PLAN' | 'AD_HOC' | 'LLM_EXTRACTED' | 'PLAN_VARIATION'

export type CareActionFrequency = 'DAILY' | 'EVERY_OTHER_DAY' | 'WEEKLY' | 'AS_NEEDED'

export type CareActionTimeOfDay = 'MORNING' | 'EVENING' | 'ANYTIME'

// One flat, polymorphic, prescribed care item. No sub-steps — distinct movements are
// distinct CareActions. `bucket` is required (ADR-0002).
export interface CareActionRecord {
  id: string
  carePlanId: string
  name: string
  description: string | null
  bucket: CareBucket
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

export interface CreateCareActionInput {
  name: string
  description?: string | null
  bucket: CareBucket
  frequency: CareActionFrequency
  timeOfDay?: CareActionTimeOfDay | null
  targetReps?: number | null
  targetDurationSeconds?: number | null
  instructions?: string | null
  sortOrder?: number
}

export type UpdateCareActionInput = Partial<CreateCareActionInput>

export interface CarePlanPayload {
  id: string
  dogId: string
  name: string
  isActive: boolean
  createdAt: string
  updatedAt: string
  actions: CareActionRecord[]
}

// ---------------------------------------------------------------------------
// CareAgentSession — the single conversational producer (ADR-0002). Replaces the two
// former agent-session tables (the exercise-agent and program-audit sessions). `kind`
// captures entry intent; `draft` is refined-across-turns JSON whose shape depends on
// kind (typed per dialog via the generic parameter below).
// ---------------------------------------------------------------------------
export type CareAgentSessionKind = 'DAILY_LOG' | 'PLAN_BUILD' | 'PLAN_AUDIT'

export type CareAgentSessionStatus =
  | 'ACTIVE'
  | 'AWAITING_INPUT'
  | 'DRAFT_READY'
  | 'COMMITTED'
  | 'FAILED'

export interface CareAgentMessage {
  role: 'user' | 'assistant'
  content: string
}

export interface CareAgentSessionPayload<TDraft = unknown> {
  id: string
  dogId: string
  kind: CareAgentSessionKind
  status: CareAgentSessionStatus
  messages: CareAgentMessage[]
  questions: string[]
  draft: TDraft | null
  voiceNoteId: string | null
  createdAt: string
  updatedAt: string
}

// PLAN_BUILD draft: a single proposed CareAction (bucket-based, no movements).
export interface ProposedCareAction {
  name: string
  description?: string | null
  bucket: CareBucket
  frequency: CareActionFrequency
  timeOfDay?: CareActionTimeOfDay | null
  targetReps?: number | null
  targetDurationSeconds?: number | null
  instructions?: string | null
  rationale: string
  safetyNotes: string
  researchSummary: string
}

// PLAN_AUDIT draft pieces (a session of kind PLAN_AUDIT proposes plan changes).
export interface AuditObservation {
  actionId: string
  actionName: string
  finding: string
  severity: 'LOW' | 'MEDIUM' | 'HIGH'
  recommendation: string
}

export interface AuditReport {
  summary: string
  strengths: string[]
  gaps: string[]
  observations: AuditObservation[]
  overallRating: 'GOOD' | 'FAIR' | 'NEEDS_WORK'
}

export interface ProposedChangeUpdates {
  name?: string
  description?: string | null
  bucket?: CareBucket
  frequency?: CareActionFrequency
  timeOfDay?: CareActionTimeOfDay | null
  instructions?: string | null
}

export interface ProposedChange {
  id: string
  type: 'UPDATE' | 'DEACTIVATE' | 'CREATE'
  actionId?: string
  actionName?: string
  updates?: ProposedChangeUpdates
  newAction?: ProposedCareAction
  reason: string
}

export interface ProposedProgramChanges {
  summary: string
  changes: ProposedChange[]
}

export interface PlanAuditDraft {
  report: AuditReport | null
  plan: ProposedProgramChanges | null
}

// DAILY_LOG draft: the review envelope a DAILY_LOG session surfaces (ADR-0003, frozen
// by API issue 0011 and realized through 0013/0015). Field names mirror the serialized
// Contract verbatim — completions/adHocActions/observations each carry a stable
// `changeId` the confirm step selects by; nullable fields are `T | null` (the server
// emits `null`, never omits — keep this aligned to avoid the bucket-style drift). Each
// `planChangeSuggestion` is inert: it has no `changeId` and can never be confirmed.
export interface DailyLogCompletionDraft {
  changeId: string
  dailyCareActionId: string
  nameSnapshot: string
  bucket: CareBucket
  actualReps: number | null
  actualDurationSeconds: number | null
  tolerance: Tolerance | null
  extractionConfidence: number
  needsReview: boolean
}

export interface DailyLogAdHocActionDraft {
  changeId: string
  name: string
  bucket: CareBucket
  actualReps: number | null
  actualDurationSeconds: number | null
  extractionConfidence: number
  needsReview: boolean
}

export interface DailyLogObservationDraft {
  changeId: string
  type: HealthObservationType
  severity: ObservationSeverity | null
  bodyArea: string | null
  note: string
  extractionConfidence: number
  needsReview: boolean
}

export interface DailyLogPlanChangeSuggestion {
  text: string
  likelyAction: string | null
}

export interface DailyLogDraft {
  completions: DailyLogCompletionDraft[]
  adHocActions: DailyLogAdHocActionDraft[]
  observations: DailyLogObservationDraft[]
  planChangeSuggestions: DailyLogPlanChangeSuggestion[]
}

// Result of committing a CareAgentSession. Polymorphic by kind: a PLAN_BUILD commit
// returns the created action; a PLAN_AUDIT commit returns the applied actions; a
// DAILY_LOG commit returns `committed` — the count of logged entries.
export interface CareAgentCommitResult {
  status: string
  action?: CareActionRecord
  applied?: CareActionRecord[]
  changesApplied?: number
  committed?: number
}

// ── Sprite Generation types ──────────────────────────────────────────────────

export type SpriteGenerationStatus =
  | 'PENDING'
  | 'RUNNING'
  | 'AWAITING_INPUT'
  | 'COMPLETED'
  | 'FAILED'
  | 'CANCELED'

export interface SpriteGenerationSessionRecord {
  id: string
  dogId: string
  userId: string
  status: SpriteGenerationStatus
  currentStep: string | null
  progress: number
  breedInput: string
  normalizedBreed: string | null
  spriteSetId: string | null
  error: string | null
  steps: Record<string, unknown>
  createdAt: string
  updatedAt: string
}

export interface SpriteManifestAnimationEntry {
  frames: number
  fps: number
  loop: boolean
  keys: string[]
}

export interface SpriteSetRecord {
  id: string
  dogId: string
  isActive: boolean
  styleVersion: string
  storagePrefix: string
  manifest: {
    styleVersion: string
    breed: string
    generatedAt: string
    animations: Partial<Record<string, SpriteManifestAnimationEntry>>
  }
  /** Base URL for frame requests, e.g. https://api/.../sprites */
  frameBaseUrl: string
  createdAt: string
}

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

export type DogSex = 'MALE' | 'FEMALE' | 'UNKNOWN'

export interface DogRecord {
  id: string
  name: string
  breed: string | null
  age: number | null
  sex: DogSex | null
  weightLbs: number | null
  condition: string | null
  vetName: string | null
  vetPhone: string | null
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
  sex?: DogSex | null
  weightLbs?: number | null
  condition?: string | null
  vetName?: string | null
  vetPhone?: string | null
  /** S3 object key from presigned upload */
  photoKey?: string | null
  notes?: string | null
}

export interface UpdateDogInput {
  name?: string
  breed?: string | null
  age?: number | null
  sex?: DogSex | null
  weightLbs?: number | null
  condition?: string | null
  vetName?: string | null
  vetPhone?: string | null
  photoKey?: string | null
  notes?: string | null
}

// The single dated execution record (ADR-0002): absorbs the former parallel daily-task
// record. Carries `bucket` directly (no category snapshot); no sub-steps; no
// separate "issue observed" flag.
export interface DailyCareActionRecord {
  id: string
  dailyCareLogId: string
  bucket: CareBucket
  source: DailyCareActionSource
  nameSnapshot: string
  descriptionSnapshot: string | null
  instructionsSnapshot: string | null
  status: DailyCareActionStatus
  completedAt: string | null
  completedByUserId: string | null
  notes: string | null
  tolerance: Tolerance | null
  targetReps: number | null
  actualReps: number | null
  targetDurationSeconds: number | null
  actualDurationSeconds: number | null
  careActionId: string | null
  substitutedForId: string | null
  substitutedFor: { id: string; nameSnapshot: string } | null
  extractionConfidence: number | null
  needsReview: boolean
  sortOrder: number
  completedBy: UserSummary | null
  createdAt: string
  updatedAt: string
}

// VoiceNote is a dumb artifact (ADR-0002): audio + transcript + transcription status
// only. Extraction is conversational and lives in a CareAgentSession.
export interface VoiceNoteRecord {
  id: string
  dogId: string
  dailyCareLogId: string
  userId: string
  audioUrl: string | null
  transcript: string
  processingStatus: VoiceNoteProcessingStatus
  createdAt: string
  user: UserSummary
}

export interface HealthObservationRecord {
  id: string
  type: HealthObservationType
  bucket: CareBucket | null
  severity: ObservationSeverity | string | null
  bodyArea: string | null
  note: string
  observedAt: string | null
  createdAt: string
  user: UserSummary
}

export interface BucketScore {
  score: number
  label: string
  summary: string
  reasons: string[]
  signals?: string[]
  computedAt: string
}

export interface BucketPayload {
  actions: DailyCareActionRecord[]
  observations: HealthObservationRecord[]
  progress?: { completed: number; total: number }
  score: BucketScore | null
}

export interface TodayPayload {
  dog: DogRecord
  date: string
  dailyLog: {
    id: string
    summary: string | null
    bucketScores: {
      activity?: BucketScore
      mobility?: BucketScore
      recovery?: BucketScore
    } | null
    scoreComputedAt: string | null
    scoreInputVersion: string | null
    latestVoiceNoteAt: string | null
    dailyCareActions: DailyCareActionRecord[]
    voiceNotes: VoiceNoteRecord[]
    healthObservations: HealthObservationRecord[]
  }
  buckets: {
    activity: BucketPayload
    mobility: BucketPayload
    recovery: BucketPayload
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
      actualReps?: number | null
      actualDurationSeconds?: number | null
      needsReview?: boolean
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
  createDailyCareAction(
    dogId: string,
    body: {
      dailyCareLogId?: string
      date?: string
      bucket: CareBucket
      name: string
      description?: string | null
      notes?: string | null
      targetReps?: number | null
      targetDurationSeconds?: number | null
    }
  ): Promise<{ success: boolean; data: DailyCareActionRecord }>
  reviewDailyCareAction(
    dogId: string,
    actionId: string,
    body: { accept: boolean; status?: DailyCareActionStatus }
  ): Promise<{ success: boolean; data: DailyCareActionRecord | { deleted: boolean } }>
  recomputeScores(
    dogId: string,
    logId: string
  ): Promise<{ success: boolean; data: TodayPayload['dailyLog']['bucketScores'] }>
  getCalendar(dogId: string, month: string): Promise<{ success: boolean; data: CalendarPayload }>
  previewJoin(code: string): Promise<{ success: boolean; data: JoinPreview }>
  joinByShareCode(shareCode: string): Promise<{ success: boolean; data: DogRecord; message?: string }>
  createCareAgentSession<TDraft = unknown>(
    dogId: string,
    kind: CareAgentSessionKind,
    options?: { message?: string; voiceNoteId?: string }
  ): Promise<{ success: boolean; data: CareAgentSessionPayload<TDraft>; message?: string }>
  getCareAgentSession<TDraft = unknown>(
    dogId: string,
    sessionId: string
  ): Promise<{ success: boolean; data: CareAgentSessionPayload<TDraft> }>
  sendCareAgentMessage<TDraft = unknown>(
    dogId: string,
    sessionId: string,
    message: string
  ): Promise<{ success: boolean; data: CareAgentSessionPayload<TDraft> }>
  confirmCareAgentSession(
    dogId: string,
    sessionId: string,
    options?: { selectedChangeIds?: string[] }
  ): Promise<{ success: boolean; data: CareAgentCommitResult; message?: string }>
  cancelCareAgentSession(
    dogId: string,
    sessionId: string
  ): Promise<{ success: boolean; data: { cancelled: boolean } }>
  createSpriteSession(
    dogId: string,
    body: { photoKey: string; breed: string }
  ): Promise<{ success: boolean; data: SpriteGenerationSessionRecord; message?: string }>
  getSpriteSession(
    dogId: string,
    sessionId: string
  ): Promise<{ success: boolean; data: SpriteGenerationSessionRecord }>
  cancelSpriteSession(
    dogId: string,
    sessionId: string
  ): Promise<{ success: boolean; data: { canceled: boolean } }>
  getDogSpriteSet(dogId: string): Promise<{ success: boolean; data: SpriteSetRecord | null }>
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
      actualReps?: number | null
      actualDurationSeconds?: number | null
      needsReview?: boolean
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

  async createDailyCareAction(
    this: ApiClient,
    dogId: string,
    body: {
      dailyCareLogId?: string
      date?: string
      bucket: CareBucket
      name: string
      description?: string | null
      notes?: string | null
      targetReps?: number | null
      targetDurationSeconds?: number | null
    }
  ) {
    return this.request<{ success: boolean; data: DailyCareActionRecord }>(
      `/v1/dogs/${dogId}/daily-actions`,
      { method: 'POST', data: body }
    )
  },

  async reviewDailyCareAction(
    this: ApiClient,
    dogId: string,
    actionId: string,
    body: { accept: boolean; status?: DailyCareActionStatus }
  ) {
    return this.request<{ success: boolean; data: DailyCareActionRecord | { deleted: boolean } }>(
      `/v1/dogs/${dogId}/daily-actions/${actionId}/review`,
      { method: 'PATCH', data: body }
    )
  },

  async recomputeScores(this: ApiClient, dogId: string, logId: string) {
    return this.request<{ success: boolean; data: TodayPayload['dailyLog']['bucketScores'] }>(
      `/v1/dogs/${dogId}/daily-logs/${logId}/recompute-scores`,
      { method: 'POST' }
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
  },

  async createCareAgentSession<TDraft = unknown>(
    this: ApiClient,
    dogId: string,
    kind: CareAgentSessionKind,
    options?: { message?: string; voiceNoteId?: string }
  ) {
    // DAILY_LOG carries `voiceNoteId` (the durable transcript to extract from);
    // PLAN_BUILD carries `message`. Only send the keys present so each kind's
    // request body matches what its server handler expects.
    const data: { kind: CareAgentSessionKind; message?: string; voiceNoteId?: string } = { kind }
    if (options?.message !== undefined) data.message = options.message
    if (options?.voiceNoteId !== undefined) data.voiceNoteId = options.voiceNoteId
    return this.request<{ success: boolean; data: CareAgentSessionPayload<TDraft>; message?: string }>(
      `/v1/dogs/${dogId}/care-agent/sessions`,
      { method: 'POST', data }
    )
  },

  async getCareAgentSession<TDraft = unknown>(this: ApiClient, dogId: string, sessionId: string) {
    return this.request<{ success: boolean; data: CareAgentSessionPayload<TDraft> }>(
      `/v1/dogs/${dogId}/care-agent/sessions/${sessionId}`
    )
  },

  async sendCareAgentMessage<TDraft = unknown>(
    this: ApiClient,
    dogId: string,
    sessionId: string,
    message: string
  ) {
    return this.request<{ success: boolean; data: CareAgentSessionPayload<TDraft> }>(
      `/v1/dogs/${dogId}/care-agent/sessions/${sessionId}/messages`,
      { method: 'POST', data: { message } }
    )
  },

  async confirmCareAgentSession(
    this: ApiClient,
    dogId: string,
    sessionId: string,
    options?: { selectedChangeIds?: string[] }
  ) {
    return this.request<{ success: boolean; data: CareAgentCommitResult; message?: string }>(
      `/v1/dogs/${dogId}/care-agent/sessions/${sessionId}/confirm`,
      { method: 'POST', data: options ?? {} }
    )
  },

  async cancelCareAgentSession(this: ApiClient, dogId: string, sessionId: string) {
    return this.request<{ success: boolean; data: { cancelled: boolean } }>(
      `/v1/dogs/${dogId}/care-agent/sessions/${sessionId}`,
      { method: 'DELETE' }
    )
  },

  // ── Sprite Generation ─────────────────────────────────────────────────────

  async createSpriteSession(
    this: ApiClient,
    dogId: string,
    body: { photoKey: string; breed: string }
  ) {
    return this.request<{ success: boolean; data: SpriteGenerationSessionRecord; message?: string }>(
      `/v1/dogs/${dogId}/sprite-sessions`,
      { method: 'POST', data: body }
    )
  },

  async getSpriteSession(this: ApiClient, dogId: string, sessionId: string) {
    return this.request<{ success: boolean; data: SpriteGenerationSessionRecord }>(
      `/v1/dogs/${dogId}/sprite-sessions/${sessionId}`
    )
  },

  async cancelSpriteSession(this: ApiClient, dogId: string, sessionId: string) {
    return this.request<{ success: boolean; data: { canceled: boolean } }>(
      `/v1/dogs/${dogId}/sprite-sessions/${sessionId}`,
      { method: 'DELETE' }
    )
  },

  async getDogSpriteSet(this: ApiClient, dogId: string) {
    return this.request<{ success: boolean; data: SpriteSetRecord | null }>(
      `/v1/dogs/${dogId}/sprite-set`
    )
  }
}
