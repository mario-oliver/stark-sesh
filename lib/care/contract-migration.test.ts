import { describe, expect, it } from 'vitest'
import type {
  BucketPayload,
  CareActionRecord,
  CareAgentSessionPayload,
  DailyCareActionRecord,
  ProposedCareAction,
  UserSummary,
  VoiceNoteRecord
} from '../api/endpoints/dogs'
import { BUCKET_LABELS, formatScheduleLabel } from './labels'
import { hasProcessingVoiceNotes } from './voiceNotes'

// These mocks are written in the CONSOLIDATED contract shape (ADR-0002). They double
// as a compile-time regression guard: if any removed field (the old category taxonomy,
// action sub-steps, the parallel daily-task record, or one-shot voice-note extraction)
// crept back into a type, this file would fail to type-check and the gate would catch it.

const user: UserSummary = { id: 'u1', email: 'a@b.com', firstName: 'A', lastName: null }

function dailyCareAction(overrides: Partial<DailyCareActionRecord> = {}): DailyCareActionRecord {
  return {
    id: 'dca1',
    dailyCareLogId: 'log1',
    bucket: 'ACTIVITY',
    source: 'PLAN',
    nameSnapshot: 'Morning walk',
    descriptionSnapshot: null,
    instructionsSnapshot: null,
    status: 'PENDING',
    completedAt: null,
    completedByUserId: null,
    notes: null,
    tolerance: null,
    targetReps: null,
    actualReps: null,
    targetDurationSeconds: 600,
    actualDurationSeconds: null,
    careActionId: 'ca1',
    substitutedForId: null,
    substitutedFor: null,
    extractionConfidence: null,
    needsReview: false,
    sortOrder: 0,
    completedBy: null,
    createdAt: '2026-06-10T08:00:00.000Z',
    updatedAt: '2026-06-10T08:00:00.000Z',
    ...overrides
  }
}

function voiceNote(overrides: Partial<VoiceNoteRecord> = {}): VoiceNoteRecord {
  return {
    id: 'vn1',
    dogId: 'd1',
    dailyCareLogId: 'log1',
    userId: 'u1',
    audioUrl: null,
    transcript: 'we did his stretches',
    processingStatus: 'PROCESSED',
    createdAt: '2026-06-10T08:00:00.000Z',
    user,
    ...overrides
  }
}

describe('consolidated contract — CareAction', () => {
  it('groups by required bucket (no category taxonomy)', () => {
    const action: CareActionRecord = {
      id: 'ca1',
      carePlanId: 'cp1',
      name: 'Hip stretch',
      description: null,
      bucket: 'MOBILITY',
      frequency: 'DAILY',
      timeOfDay: 'MORNING',
      targetReps: 10,
      targetDurationSeconds: null,
      instructions: null,
      sortOrder: 0,
      isActive: true,
      createdAt: '2026-06-10T08:00:00.000Z',
      updatedAt: '2026-06-10T08:00:00.000Z'
    }
    // bucket is required and is the only categorization.
    expect(BUCKET_LABELS[action.bucket]).toBe('Mobility')
    expect(formatScheduleLabel(action.frequency, action.timeOfDay)).toBe('Daily · morning')
  })
})

describe('consolidated contract — DailyCareAction (absorbs the daily-task record)', () => {
  it('maps bucketed daily actions into a completed/total progress count', () => {
    const bucket: BucketPayload = {
      actions: [
        dailyCareAction({ id: 'a', status: 'COMPLETED' }),
        dailyCareAction({ id: 'b', status: 'PENDING' }),
        dailyCareAction({ id: 'c', status: 'SKIPPED', source: 'LLM_EXTRACTED' })
      ],
      observations: [],
      score: null
    }
    const completed = bucket.actions.filter(a => a.status === 'COMPLETED').length
    expect(completed).toBe(1)
    expect(bucket.actions).toHaveLength(3)
    // richer daily-task fields survive on the merged record:
    expect(bucket.actions[2].source).toBe('LLM_EXTRACTED')
    expect(bucket.actions[0].needsReview).toBe(false)
  })
})

describe('consolidated contract — VoiceNote is a dumb artifact', () => {
  it('hasProcessingVoiceNotes reads slimmed notes (transcript + status only)', () => {
    expect(hasProcessingVoiceNotes([voiceNote({ processingStatus: 'TRANSCRIBED' })])).toBe(true)
    expect(hasProcessingVoiceNotes([voiceNote({ processingStatus: 'PROCESSED' })])).toBe(false)
    expect(hasProcessingVoiceNotes(undefined)).toBe(false)
  })
})

describe('consolidated contract — one CareAgentSession', () => {
  it('carries a kind discriminator and a typed draft', () => {
    const draft: ProposedCareAction = {
      name: 'Assisted sit-to-stand',
      bucket: 'ACTIVITY',
      frequency: 'EVERY_OTHER_DAY',
      rationale: 'builds rear-limb strength',
      safetyNotes: 'stop if painful',
      researchSummary: 'standard post-op protocol'
    }
    const session: CareAgentSessionPayload<ProposedCareAction> = {
      id: 's1',
      dogId: 'd1',
      kind: 'PLAN_BUILD',
      status: 'DRAFT_READY',
      messages: [{ role: 'user', content: 'add a strength exercise' }],
      questions: [],
      draft,
      voiceNoteId: null,
      createdAt: '2026-06-10T08:00:00.000Z',
      updatedAt: '2026-06-10T08:00:00.000Z'
    }
    expect(session.kind).toBe('PLAN_BUILD')
    expect(session.draft?.bucket).toBe('ACTIVITY')
  })
})
