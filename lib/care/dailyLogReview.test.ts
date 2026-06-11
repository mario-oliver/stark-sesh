import { describe, expect, it } from 'vitest'
import type {
  DailyLogAdHocActionDraft,
  DailyLogCompletionDraft,
  DailyLogDraft,
  DailyLogObservationDraft
} from '../api/endpoints/dogs'
import {
  defaultSelectedChangeIds,
  isEmptyDraft,
  sanitizeSelectedChangeIds,
  selectableChangeIds,
  selectableItems
} from './dailyLogReview'

function completion(o: Partial<DailyLogCompletionDraft> = {}): DailyLogCompletionDraft {
  return {
    changeId: 'c1',
    dailyCareActionId: 'a1',
    nameSnapshot: 'Sit-to-stand reps',
    bucket: 'ACTIVITY',
    actualReps: 10,
    actualDurationSeconds: null,
    tolerance: 'GOOD',
    extractionConfidence: 0.95,
    needsReview: false,
    ...o
  }
}

function adHoc(o: Partial<DailyLogAdHocActionDraft> = {}): DailyLogAdHocActionDraft {
  return {
    changeId: 'h1',
    name: 'Cold pack on hock',
    bucket: 'RECOVERY',
    actualReps: null,
    actualDurationSeconds: 300,
    extractionConfidence: 0.88,
    needsReview: false,
    ...o
  }
}

function observation(o: Partial<DailyLogObservationDraft> = {}): DailyLogObservationDraft {
  return {
    changeId: 'o1',
    type: 'PAIN',
    severity: 'MILD',
    bodyArea: 'Left hind leg',
    note: 'Slight limp after the walk',
    extractionConfidence: 0.82,
    needsReview: false,
    ...o
  }
}

const FULL_DRAFT: DailyLogDraft = {
  completions: [
    completion({ changeId: 'c1', needsReview: false }),
    completion({ changeId: 'c2', needsReview: true }) // low-confidence, flagged
  ],
  adHocActions: [
    adHoc({ changeId: 'h1', needsReview: false }),
    adHoc({ changeId: 'h2', needsReview: true }) // suspected duplicate, flagged
  ],
  observations: [observation({ changeId: 'o1', needsReview: false })],
  planChangeSuggestions: [{ text: 'Bump sit-to-stands to 15', likelyAction: 'Increase target reps' }]
}

describe('daily-log draft mapping (AC2)', () => {
  it('flattens all three groups in display order', () => {
    expect(selectableItems(FULL_DRAFT).map(i => i.changeId)).toEqual([
      'c1',
      'c2',
      'h1',
      'h2',
      'o1'
    ])
  })

  it('pre-selects confident items and leaves needsReview items unselected but surfaced', () => {
    const selected = defaultSelectedChangeIds(FULL_DRAFT)
    // confident across completions / ad-hoc / observations are pre-selected
    expect(new Set(selected)).toEqual(new Set(['c1', 'h1', 'o1']))
    // flagged items are NOT pre-selected ...
    expect(selected).not.toContain('c2')
    expect(selected).not.toContain('h2')
    // ... but they are still surfaced in the draft for opt-in
    expect(selectableChangeIds(FULL_DRAFT)).toContain('c2')
    expect(selectableChangeIds(FULL_DRAFT)).toContain('h2')
  })

  it('detects an empty draft (nothing loggable)', () => {
    expect(isEmptyDraft(FULL_DRAFT)).toBe(false)
    expect(
      isEmptyDraft({
        completions: [],
        adHocActions: [],
        observations: [],
        // a plan-change suggestion alone is NOT loggable content
        planChangeSuggestions: [{ text: 'Maybe rest tomorrow', likelyAction: null }]
      })
    ).toBe(true)
  })
})

describe('confirm selection guard (AC1)', () => {
  it('keeps exactly the user-selected changeIds', () => {
    const result = sanitizeSelectedChangeIds(['c1', 'o1'], FULL_DRAFT)
    expect(new Set(result)).toEqual(new Set(['c1', 'o1']))
  })

  it('never lets a plan-change suggestion (no changeId) into the payload', () => {
    // a plan-change suggestion's text/likelyAction can never be a valid changeId
    const result = sanitizeSelectedChangeIds(
      ['c1', 'Bump sit-to-stands to 15', 'Increase target reps', 'not-a-real-id'],
      FULL_DRAFT
    )
    expect(result).toEqual(['c1'])
  })

  it('de-dupes a repeated selection', () => {
    expect(sanitizeSelectedChangeIds(['h1', 'h1', 'c1'], FULL_DRAFT)).toEqual(['h1', 'c1'])
  })
})
