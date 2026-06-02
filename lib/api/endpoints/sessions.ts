import type { ApiResponse } from '../api-client'
import { AxiosInstance } from 'axios'
import type { SessionType } from '@/lib/types'

export type { SessionType }

export interface TeamMemberRecord {
  id: string
  teamId: string
  number: string
  name: string
  isActive?: boolean
  deactivatedAt?: string | null
  createdAt: string
  aliases?: Array<{ id: string; teamMemberId: string; alias: string; normalizedAlias: string; createdAt: string }>
}

export interface SessionParticipantRecord {
  id: string
  sessionId: string
  teamMemberId: string
  teamMember: TeamMemberRecord
}

export interface TeamRecord {
  id: string
  name: string | null
  userId: string
  createdAt: string
  updatedAt: string
  members: TeamMemberRecord[]
}

export interface PracticeDrillRecord {
  id: string
  practicePlanId: string
  sortOrder: number
  title: string
  description: string | null
  execution: string | null
  durationMinutes: number | null
  focusTags: string[]
  playerFocus: Array<{ teamMemberId: string; teamMember: TeamMemberRecord }>
}

export type PlanSource = 'MANUAL' | 'LLM' | 'MIXED'

export interface PracticePlanRecord {
  id: string
  sessionId: string
  title: string | null
  goals: string[]
  userPrompt: string | null
  source: PlanSource
  lastGeneratedAt: string | null
  createdAt: string
  updatedAt: string
  drills: PracticeDrillRecord[]
}

export interface ObservationRecord {
  id: string
  sessionId: string
  drillId: string | null
  text: string
  observationType: 'PLAYER_FEEDBACK' | 'TEAM_PATTERN' | 'EFFORT' | 'TACTICAL' | 'GENERAL'
  sentiment: 'POSITIVE' | 'NEGATIVE' | 'NEUTRAL' | 'MIXED' | null
  extractedTags: string[] | null
  scope: 'TEAM_WIDE' | 'PLAYER_SPECIFIC' | 'MIXED' | 'UNKNOWN'
  taggingStatus: 'PENDING' | 'PROCESSING' | 'COMPLETE' | 'FAILED'
  statStatus?: 'PENDING' | 'PROCESSING' | 'COMPLETE' | 'FAILED'
  statError?: string | null
  statExtraction?: unknown
  taggingError?: string | null
  taggedAt?: string | null
  recordedAt: string
  updatedAt: string
  drill: PracticeDrillRecord | null
  playerTags: ObservationPlayerTagRecord[]
}

export interface ObservationPlayerTagRecord {
  id: string
  observationId: string
  teamMemberId: string
  confidence?: number | null
  reason?: string | null
  createdAt: string
  teamMember: TeamMemberRecord
}

export interface SessionPlayerStatRecord {
  id: string
  sessionId: string
  teamMemberId: string
  points: number
  assists: number
  rebounds: number
  steals: number
  blocks: number
  turnovers: number
  fouls: number
  createdAt: string
  updatedAt: string
  teamMember: TeamMemberRecord
  computed?: Record<SessionStatMetric, number>
  final?: Record<SessionStatMetric, number>
  lockState?: Record<SessionStatMetric, { locked: boolean; manualOverride: number | null }>
}

export interface DerivedStatLineRecord {
  id: string
  sessionId: string
  observationId: string
  teamMemberId: string | null
  playerRef: string | null
  evidenceText: string | null
  lineStart: number | null
  lineEnd: number | null
  confidence: number | null
  points: number
  assists: number
  rebounds: number
  steals: number
  blocks: number
  turnovers: number
  fouls: number
  status: 'PENDING_REVIEW' | 'APPROVED' | 'REJECTED' | 'EDITED'
  reviewNote: string | null
  reviewedAt: string | null
  teamMember?: TeamMemberRecord | null
  observation?: ObservationRecord | null
}

export type SessionStatMetric =
  | 'points'
  | 'assists'
  | 'rebounds'
  | 'steals'
  | 'blocks'
  | 'turnovers'
  | 'fouls'

/** One drill bucket (or general / session-wide) for a single player's tagged observations */
export interface PlayerObservationSection {
  drillId: string | null
  drillTitle: string | null
  sortOrder: number | null
  observations: ObservationRecord[]
}

export interface PlayerObservationView {
  teamMemberId: string
  teamMember: TeamMemberRecord
  sections: PlayerObservationSection[]
}

export interface Session {
  id: string
  type: SessionType
  userId: string
  teamId: string
  startedAt: string
  notesSummary: string | null
  createdAt: string
  updatedAt: string
  team: TeamRecord
  participants: SessionParticipantRecord[]
  observations: ObservationRecord[]
  practicePlan: PracticePlanRecord | null
  playerStats: SessionPlayerStatRecord[]
}

export interface CreateSessionInput {
  type: SessionType
  teamId: string
  participantMemberIds?: string[]
  startedAt?: string
}

export interface PlanDrillInput {
  title: string
  description?: string | null
  execution?: string | null
  durationMinutes?: number | null
  focusTags?: string[]
  playerFocusMemberIds?: string[]
}

export interface ReplacePracticePlanInput {
  title?: string | null
  goals?: string[]
  userPrompt?: string | null
  drills: PlanDrillInput[]
}

/** Method signatures for Sessions API; merged onto ApiClient. */
export interface SessionsApi {
  createSession(data: CreateSessionInput): Promise<ApiResponse<{ session: Session }>>
  getSession(sessionId: string): Promise<ApiResponse<{ session: Session }>>
  getSessions(userId: string): Promise<ApiResponse<{ sessions: Session[] }>>
  getPracticePlan(sessionId: string): Promise<ApiResponse<{ practicePlan: PracticePlanRecord | null }>>
  replacePracticePlan(
    sessionId: string,
    data: ReplacePracticePlanInput
  ): Promise<ApiResponse<{ practicePlan: PracticePlanRecord }>>
  generatePracticePlan(
    sessionId: string,
    data: { userPromptAddition?: string }
  ): Promise<ApiResponse<{ practicePlan: PracticePlanRecord }>>
  addPracticeDrill(
    sessionId: string,
    data: PlanDrillInput
  ): Promise<ApiResponse<{ drill: PracticeDrillRecord; practicePlan: PracticePlanRecord }>>
  updatePracticeDrill(
    sessionId: string,
    drillId: string,
    data: Partial<PlanDrillInput>
  ): Promise<ApiResponse<{ drill: PracticeDrillRecord; practicePlan: PracticePlanRecord }>>
  deletePracticeDrill(
    sessionId: string,
    drillId: string
  ): Promise<ApiResponse<{ practicePlan: PracticePlanRecord | null }>>
  createDrillFromTranscript(
    sessionId: string,
    data: { transcript: string }
  ): Promise<ApiResponse<{ drill: PracticeDrillRecord; practicePlan: PracticePlanRecord }>>
  updateObservation(
    sessionId: string,
    observationId: string,
    data: { text: string; drillId?: string | null }
  ): Promise<ApiResponse<{ observation: ObservationRecord }>>
  transcribeSession(
    sessionId: string,
    formData: FormData,
    options?: { prompt?: string; drillId?: string; preview?: boolean }
  ): Promise<
    ApiResponse<
      | { text: string; observation?: ObservationRecord | null }
      | { text: string }
    >
  >
  getPlayerObservationView(
    sessionId: string,
    teamMemberId: string
  ): Promise<ApiResponse<{ playerObservationView: PlayerObservationView }>>
  getSessionStats(
    sessionId: string
  ): Promise<ApiResponse<{ stats: SessionPlayerStatRecord[]; attributionSummary?: Array<{ teamMemberId: string; observationCount: number }>; derivedLines?: DerivedStatLineRecord[] }>>
  replaceSessionStats(
    sessionId: string,
    data: { stats: Array<Omit<SessionPlayerStatRecord, 'id' | 'sessionId' | 'createdAt' | 'updatedAt' | 'teamMember'>> }
  ): Promise<ApiResponse<{ stats: SessionPlayerStatRecord[] }>>
  transcribeSessionStats(
    sessionId: string,
    formData: FormData,
    options?: { prompt?: string }
  ): Promise<ApiResponse<{ text: string; parsedStats: unknown[]; stats: SessionPlayerStatRecord[] }>>
  patchSessionStatMetric(
    sessionId: string,
    playerId: string,
    metric: SessionStatMetric,
    data: { lock?: boolean; manualOverride?: number | null }
  ): Promise<ApiResponse<{ stat: SessionPlayerStatRecord }>>
  rerunObservationProcessing(
    sessionId: string,
    observationId: string
  ): Promise<ApiResponse<{ queued: boolean; observationId: string }>>
  resolveUnrecognizedName(
    sessionId: string,
    observationId: string,
    data: { rawName: string; teamMemberId: string; applyToSessionOnly?: boolean }
  ): Promise<ApiResponse<{ resolved: boolean; observationId: string; teamMemberId: string; rawName: string }>>
  rerunGameStats(
    sessionId: string,
    data?: { onlyFailed?: boolean; fromTimestamp?: string }
  ): Promise<ApiResponse<{ queued: number; batchKey: string }>>
  editDerivedStatLine(
    sessionId: string,
    lineId: string,
    data: Partial<Pick<DerivedStatLineRecord, 'points' | 'assists' | 'rebounds' | 'steals' | 'blocks' | 'turnovers' | 'fouls' | 'teamMemberId' | 'reviewNote'>>
  ): Promise<ApiResponse<{ line: DerivedStatLineRecord }>>
  approveDerivedStatLine(
    sessionId: string,
    lineId: string,
    data?: { reviewNote?: string | null }
  ): Promise<ApiResponse<{ line: DerivedStatLineRecord }>>
  rejectDerivedStatLine(
    sessionId: string,
    lineId: string,
    data?: { reviewNote?: string | null }
  ): Promise<ApiResponse<{ line: DerivedStatLineRecord }>>
  getObservationJobs(
    sessionId: string
  ): Promise<ApiResponse<{ jobs: Array<{ id: string; observationId: string; status: 'PENDING' | 'RUNNING' | 'RETRY' | 'COMPLETED' | 'FAILED' }> }>>
}

function parseJsonStringArray(v: unknown): string[] {
  if (v == null) return []
  if (Array.isArray(v)) return v.filter((x): x is string => typeof x === 'string')
  return []
}

/** Normalize API session (Prisma Json goals/focusTags) for client use */
export function normalizeSession(raw: unknown): Session {
  const s = raw as Record<string, unknown>
  const team = s.team as Record<string, unknown>
  const practicePlan = s.practicePlan as Record<string, unknown> | null

  const normalizeDrill = (d: Record<string, unknown> | null | undefined): PracticeDrillRecord | null => {
    if (!d) return null
    const pf =
      (d.playerFocus as Array<{ teamMemberId: string; teamMember: TeamMemberRecord }>) ?? []
    return {
      id: d.id as string,
      practicePlanId: d.practicePlanId as string,
      sortOrder: d.sortOrder as number,
      title: (d.title as string) ?? (d.name as string) ?? '',
      description: (d.description as string) ?? null,
      execution: (d.execution as string) ?? null,
      durationMinutes: (d.durationMinutes as number) ?? null,
      focusTags: parseJsonStringArray(d.focusTags),
      playerFocus: pf
    }
  }

  const normalizePlan = (p: Record<string, unknown> | null): PracticePlanRecord | null => {
    if (!p) return null
    const drillsRaw = (p.drills as Array<Record<string, unknown>>) ?? (p.segments as Array<Record<string, unknown>>) ?? []
    return {
      id: p.id as string,
      sessionId: p.sessionId as string,
      title: (p.title as string) ?? null,
      goals: parseJsonStringArray(p.goals),
      userPrompt: (p.userPrompt as string) ?? null,
      source: p.source as PlanSource,
      lastGeneratedAt: (p.lastGeneratedAt as string) ?? null,
      createdAt: p.createdAt as string,
      updatedAt: p.updatedAt as string,
      drills: drillsRaw.map(d => normalizeDrill(d)).filter((x): x is PracticeDrillRecord => x != null)
    }
  }

  const normalizeObs = (o: Record<string, unknown>): ObservationRecord => {
    const drillId = (o.drillId as string) ?? (o.segmentId as string) ?? null
    const drillRaw = (o.drill ?? o.segment) as Record<string, unknown> | null | undefined
    return {
      id: o.id as string,
      sessionId: o.sessionId as string,
      drillId,
      text: (o.text as string) ?? (o.rawText as string) ?? '',
      observationType: (o.observationType as ObservationRecord['observationType']) ?? 'GENERAL',
      sentiment: (o.sentiment as ObservationRecord['sentiment']) ?? null,
      extractedTags: o.extractedTags ? parseJsonStringArray(o.extractedTags) : null,
      scope: (o.scope as ObservationRecord['scope']) ?? 'UNKNOWN',
      taggingStatus: (o.taggingStatus as ObservationRecord['taggingStatus']) ?? 'PENDING',
      statStatus: (o.statStatus as ObservationRecord['statStatus']) ?? 'PENDING',
      statError: (o.statError as string) ?? null,
      statExtraction: o.statExtraction ?? null,
      taggingError: (o.taggingError as string) ?? null,
      taggedAt: (o.taggedAt as string) ?? null,
      recordedAt: (o.recordedAt as string) ?? (o.createdAt as string),
      updatedAt: o.updatedAt as string,
      drill: normalizeDrill(drillRaw),
      playerTags: (o.playerTags as ObservationPlayerTagRecord[]) ?? []
    }
  }

  const normalizePlayerStat = (s: Record<string, unknown>): SessionPlayerStatRecord => ({
    id: s.id as string,
    sessionId: s.sessionId as string,
    teamMemberId: s.teamMemberId as string,
    points: (s.points as number) ?? 0,
    assists: (s.assists as number) ?? 0,
    rebounds: (s.rebounds as number) ?? 0,
    steals: (s.steals as number) ?? 0,
    blocks: (s.blocks as number) ?? 0,
    turnovers: (s.turnovers as number) ?? 0,
    fouls: (s.fouls as number) ?? 0,
    createdAt: s.createdAt as string,
    updatedAt: s.updatedAt as string,
    teamMember: (s.teamMember as TeamMemberRecord) ?? ({
      id: s.teamMemberId as string,
      teamId: team.id as string,
      number: '',
      name: '',
      createdAt: ''
    } as TeamMemberRecord)
  })

  return {
    id: s.id as string,
    type: s.type as SessionType,
    userId: s.userId as string,
    teamId: s.teamId as string,
    startedAt: (s.startedAt as string) ?? (s.createdAt as string),
    notesSummary: (s.notesSummary as string) ?? null,
    createdAt: s.createdAt as string,
    updatedAt: s.updatedAt as string,
    team: {
      id: team.id as string,
      name: (team.name as string) ?? null,
      userId: team.userId as string,
      createdAt: team.createdAt as string,
      updatedAt: team.updatedAt as string,
      members: (team.members as TeamMemberRecord[]) ?? []
    },
    participants: (s.participants as SessionParticipantRecord[]) ?? [],
    observations: ((s.observations as Array<Record<string, unknown>>) ?? []).map(normalizeObs),
    practicePlan: normalizePlan(practicePlan as Record<string, unknown> | null),
    playerStats: ((s.playerStats as Array<Record<string, unknown>>) ?? []).map(normalizePlayerStat)
  }
}

/**
 * Observations that include an AI/player tag for this team member, grouped by drill:
 * general (no drill link) first, then practice-plan drills in order, then any orphan drill links.
 */
export function buildPlayerObservationSections(
  observations: ObservationRecord[],
  planDrills: PracticeDrillRecord[],
  teamMemberId: string
): PlayerObservationSection[] {
  const tagged = observations.filter(o => o.playerTags.some(t => t.teamMemberId === teamMemberId))
  const byDrill = new Map<string | null, ObservationRecord[]>()
  for (const o of tagged) {
    const k = o.drillId
    const list = byDrill.get(k) ?? []
    list.push(o)
    byDrill.set(k, list)
  }

  const planIds = new Set(planDrills.map(d => d.id))
  const sections: PlayerObservationSection[] = []

  sections.push({
    drillId: null,
    drillTitle: 'General & session-wide',
    sortOrder: null,
    observations: byDrill.get(null) ?? []
  })

  for (const d of planDrills) {
    sections.push({
      drillId: d.id,
      drillTitle: d.title,
      sortOrder: d.sortOrder,
      observations: byDrill.get(d.id) ?? []
    })
  }

  for (const [drillId, obs] of byDrill) {
    if (drillId === null || planIds.has(drillId)) continue
    sections.push({
      drillId,
      drillTitle: obs[0]?.drill?.title ?? 'Drill',
      sortOrder: null,
      observations: obs
    })
  }

  return sections
}

export const sessionsMethods = {
  async createSession(this: { axiosInstance: AxiosInstance }, input: CreateSessionInput) {
    return await this.axiosInstance.post('/v1/sessions', input)
  },

  async getSession(this: { axiosInstance: AxiosInstance }, sessionId: string) {
    return await this.axiosInstance.get(`/v1/sessions/${sessionId}`)
  },

  async getPlayerObservationView(
    this: { axiosInstance: AxiosInstance },
    sessionId: string,
    teamMemberId: string
  ) {
    return await this.axiosInstance.get(
      `/v1/sessions/${sessionId}/observations/player/${teamMemberId}`
    )
  },

  async getSessions(this: { axiosInstance: AxiosInstance }, userId: string) {
    return await this.axiosInstance.get(`/v1/sessions/users/${userId}`)
  },

  async getPracticePlan(this: { axiosInstance: AxiosInstance }, sessionId: string) {
    return await this.axiosInstance.get(`/v1/sessions/${sessionId}/plan`)
  },

  async replacePracticePlan(
    this: { axiosInstance: AxiosInstance },
    sessionId: string,
    data: ReplacePracticePlanInput
  ) {
    return await this.axiosInstance.put(`/v1/sessions/${sessionId}/plan`, data)
  },

  async generatePracticePlan(
    this: { axiosInstance: AxiosInstance },
    sessionId: string,
    data: { userPromptAddition?: string }
  ) {
    return await this.axiosInstance.post(`/v1/sessions/${sessionId}/plan/generate`, data)
  },

  async addPracticeDrill(this: { axiosInstance: AxiosInstance }, sessionId: string, data: PlanDrillInput) {
    return await this.axiosInstance.post(`/v1/sessions/${sessionId}/plan/drills`, data)
  },

  async updatePracticeDrill(
    this: { axiosInstance: AxiosInstance },
    sessionId: string,
    drillId: string,
    data: Partial<PlanDrillInput>
  ) {
    return await this.axiosInstance.patch(`/v1/sessions/${sessionId}/plan/drills/${drillId}`, data)
  },

  async deletePracticeDrill(this: { axiosInstance: AxiosInstance }, sessionId: string, drillId: string) {
    return await this.axiosInstance.delete(`/v1/sessions/${sessionId}/plan/drills/${drillId}`)
  },

  async createDrillFromTranscript(
    this: { axiosInstance: AxiosInstance },
    sessionId: string,
    data: { transcript: string }
  ) {
    return await this.axiosInstance.post(`/v1/sessions/${sessionId}/plan/drills/from-transcript`, data)
  },

  async updateObservation(
    this: { axiosInstance: AxiosInstance },
    sessionId: string,
    observationId: string,
    data: { text: string; drillId?: string | null }
  ) {
    return await this.axiosInstance.patch(
      `/v1/sessions/${sessionId}/observations/${observationId}`,
      data
    )
  },

  async transcribeSession(
    this: { axiosInstance: AxiosInstance },
    sessionId: string,
    formData: FormData,
    options?: { prompt?: string; drillId?: string; preview?: boolean }
  ) {
    const params = new URLSearchParams()
    if (options?.prompt != null && options.prompt !== '') {
      params.set('prompt', options.prompt)
    }
    if (options?.drillId) {
      params.set('drillId', options.drillId)
    }
    if (options?.preview) {
      params.set('preview', 'true')
    }
    const q = params.toString()
    const url =
      q !== ''
        ? `/v1/sessions/${sessionId}/transcribe?${q}`
        : `/v1/sessions/${sessionId}/transcribe`
    return await this.axiosInstance.post(url, formData)
  },

  async getSessionStats(this: { axiosInstance: AxiosInstance }, sessionId: string) {
    return await this.axiosInstance.get(`/v1/sessions/${sessionId}/stats`)
  },

  async replaceSessionStats(
    this: { axiosInstance: AxiosInstance },
    sessionId: string,
    data: {
      stats: Array<{
        teamMemberId: string
        points: number
        assists: number
        rebounds: number
        steals: number
        blocks: number
        turnovers: number
        fouls: number
      }>
    }
  ) {
    return await this.axiosInstance.put(`/v1/sessions/${sessionId}/stats`, data)
  },

  async transcribeSessionStats(
    this: { axiosInstance: AxiosInstance },
    sessionId: string,
    formData: FormData,
    options?: { prompt?: string }
  ) {
    const params = new URLSearchParams()
    if (options?.prompt != null && options.prompt !== '') {
      params.set('prompt', options.prompt)
    }
    const q = params.toString()
    const url =
      q !== ''
        ? `/v1/sessions/${sessionId}/stats/transcribe?${q}`
        : `/v1/sessions/${sessionId}/stats/transcribe`
    return await this.axiosInstance.post(url, formData)
  },

  async patchSessionStatMetric(
    this: { axiosInstance: AxiosInstance },
    sessionId: string,
    playerId: string,
    metric: SessionStatMetric,
    data: { lock?: boolean; manualOverride?: number | null }
  ) {
    return await this.axiosInstance.patch(`/v1/sessions/${sessionId}/stats/${playerId}/${metric}`, data)
  },

  async rerunObservationProcessing(
    this: { axiosInstance: AxiosInstance },
    sessionId: string,
    observationId: string
  ) {
    return await this.axiosInstance.post(`/v1/sessions/${sessionId}/observations/${observationId}/rerun`)
  },

  async resolveUnrecognizedName(
    this: { axiosInstance: AxiosInstance },
    sessionId: string,
    observationId: string,
    data: { rawName: string; teamMemberId: string; applyToSessionOnly?: boolean }
  ) {
    return await this.axiosInstance.post(
      `/v1/sessions/${sessionId}/observations/${observationId}/unrecognized-name/resolve`,
      data
    )
  },

  async rerunGameStats(
    this: { axiosInstance: AxiosInstance },
    sessionId: string,
    data?: { onlyFailed?: boolean; fromTimestamp?: string }
  ) {
    return await this.axiosInstance.post(`/v1/sessions/${sessionId}/stats/rerun`, data ?? {})
  },

  async editDerivedStatLine(
    this: { axiosInstance: AxiosInstance },
    sessionId: string,
    lineId: string,
    data: Partial<Pick<DerivedStatLineRecord, 'points' | 'assists' | 'rebounds' | 'steals' | 'blocks' | 'turnovers' | 'fouls' | 'teamMemberId' | 'reviewNote'>>
  ) {
    return await this.axiosInstance.patch(`/v1/sessions/${sessionId}/stats/lines/${lineId}`, data)
  },

  async approveDerivedStatLine(
    this: { axiosInstance: AxiosInstance },
    sessionId: string,
    lineId: string,
    data?: { reviewNote?: string | null }
  ) {
    return await this.axiosInstance.post(`/v1/sessions/${sessionId}/stats/lines/${lineId}/approve`, data ?? {})
  },

  async rejectDerivedStatLine(
    this: { axiosInstance: AxiosInstance },
    sessionId: string,
    lineId: string,
    data?: { reviewNote?: string | null }
  ) {
    return await this.axiosInstance.post(`/v1/sessions/${sessionId}/stats/lines/${lineId}/reject`, data ?? {})
  },

  async getObservationJobs(this: { axiosInstance: AxiosInstance }, sessionId: string) {
    return await this.axiosInstance.get(`/v1/sessions/${sessionId}/observation-jobs`)
  }
}
