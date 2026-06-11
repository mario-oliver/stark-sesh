/**
 * THROWAWAY prototype fixtures for issue 0016 (web draft-review UI prototypes).
 *
 * Mock data ONLY — shaped to the *paper* DAILY_LOG draft Contract from
 * [[Issues - DAILY_LOG Voice Flow]] / [[PRD-daily-log-voice-flow]] §Data/schema.
 * Types are defined locally on purpose so this dev route touches nothing in
 * `lib/api/` and is trivially deletable (delete `app/dev/`) after Mario picks a
 * variant. Do not wire this to the real client — that is issue 0017.
 */

// --- Paper Contract draft shape (local mirror, mock-only) -------------------

export type CareBucket = 'ACTIVITY' | 'MOBILITY' | 'RECOVERY'
export type Tolerance = 'GOOD' | 'FAIR' | 'POOR'
export type ObservationType = 'PAIN' | 'MOOD' | 'APPETITE' | 'MOBILITY' | 'OTHER'
export type Severity = 'MILD' | 'MODERATE' | 'SEVERE'

export interface CompletionDraft {
  changeId: string
  dailyCareActionId: string
  nameSnapshot: string
  bucket: CareBucket
  actualReps?: number
  actualDurationSeconds?: number
  tolerance?: Tolerance
  extractionConfidence: number
  needsReview: boolean
}

export interface AdHocActionDraft {
  changeId: string
  name: string
  bucket: CareBucket
  actualReps?: number
  actualDurationSeconds?: number
  extractionConfidence: number
  needsReview: boolean
}

export interface ObservationDraft {
  changeId: string
  type: ObservationType
  severity?: Severity
  bodyArea?: string
  note: string
  extractionConfidence: number
  needsReview: boolean
}

/** Inert nudge toward PLAN_AUDIT — never in selectedChangeIds, commits nothing. */
export interface PlanChangeSuggestion {
  text: string
  likelyAction: string
}

export interface DailyLogDraft {
  completions: CompletionDraft[]
  adHocActions: AdHocActionDraft[]
  observations: ObservationDraft[]
  planChangeSuggestions: PlanChangeSuggestion[]
}

/** The one-round AWAITING_INPUT clarifying question (blocked-only, ADR-0003 §5). */
export interface ClarifyingQuestion {
  /** What the agent heard but couldn't place. */
  heard: string
  question: string
  /** Candidate resolutions the user picks between (mock). */
  options: { id: string; label: string; hint?: string }[]
}

export type Scenario = 'DRAFT_READY' | 'AWAITING_INPUT' | 'EMPTY'

// --- Mock transcript (what the voice note "said") ---------------------------

export const MOCK_TRANSCRIPT =
  "Did Stark's sit-to-stands this morning, got through ten and he looked strong. " +
  'Underwater treadmill for about ten minutes, he was a bit tired by the end. ' +
  'Evening walk too. Put a cold pack on his left hock after. ' +
  'He had a slight limp on the back left after the morning walk but it eased up. ' +
  'Honestly he seems ready for more — maybe bump the sit-to-stands up.'

// --- DRAFT_READY: the full draft -------------------------------------------

export const MOCK_DRAFT: DailyLogDraft = {
  completions: [
    {
      changeId: 'c1',
      dailyCareActionId: 'a1',
      nameSnapshot: 'Sit-to-stand reps',
      bucket: 'ACTIVITY',
      actualReps: 10,
      tolerance: 'GOOD',
      extractionConfidence: 0.96,
      needsReview: false
    },
    {
      changeId: 'c2',
      dailyCareActionId: 'a2',
      nameSnapshot: 'Underwater treadmill',
      bucket: 'ACTIVITY',
      actualDurationSeconds: 600,
      tolerance: 'FAIR',
      extractionConfidence: 0.81,
      needsReview: false
    },
    {
      changeId: 'c3',
      dailyCareActionId: 'a3',
      nameSnapshot: 'Evening leash walk',
      bucket: 'MOBILITY',
      // duration not clearly stated -> flagged for review
      extractionConfidence: 0.54,
      needsReview: true
    }
  ],
  adHocActions: [
    {
      changeId: 'h1',
      name: 'Cold pack on left hock',
      bucket: 'RECOVERY',
      actualDurationSeconds: 300,
      extractionConfidence: 0.89,
      needsReview: false
    },
    {
      changeId: 'h2',
      name: 'Extra stairs practice',
      bucket: 'ACTIVITY',
      actualReps: 5,
      // suspected same-day duplicate of a logged item -> flagged
      extractionConfidence: 0.49,
      needsReview: true
    }
  ],
  observations: [
    {
      changeId: 'o1',
      type: 'PAIN',
      severity: 'MILD',
      bodyArea: 'Left hind leg',
      note: 'Slight limp after the morning walk, eased up after rest.',
      extractionConfidence: 0.84,
      needsReview: false
    },
    {
      changeId: 'o2',
      type: 'MOOD',
      note: 'Bright and eager — strong through the sit-to-stands.',
      extractionConfidence: 0.91,
      needsReview: false
    }
  ],
  planChangeSuggestions: [
    {
      text: 'Stark sounds ready to bump sit-to-stands from 10 to 15 reps.',
      likelyAction: 'Increase target reps'
    }
  ]
}

// --- EMPTY: nothing loggable (ADR-0003 §9) ---------------------------------

export const EMPTY_DRAFT: DailyLogDraft = {
  completions: [],
  adHocActions: [],
  observations: [],
  planChangeSuggestions: []
}

export const EMPTY_AGENT_MESSAGE = "I didn't catch any care to log in that note."

// --- AWAITING_INPUT: one blocking question (ADR-0003 §5) -------------------

export const MOCK_QUESTION: ClarifyingQuestion = {
  heard: '"did his leg exercises"',
  question:
    'You mentioned "leg exercises" — which one did you mean? A couple of things on Stark\'s plan match.',
  options: [
    { id: 'q-sit', label: 'Sit-to-stand reps', hint: 'Activity · 10 reps planned' },
    { id: 'q-balance', label: 'Balance board', hint: 'Activity · 5 min planned' },
    { id: 'q-both', label: 'Both of them' },
    { id: 'q-neither', label: 'Neither — skip this' }
  ]
}
