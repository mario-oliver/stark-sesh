/**
 * DAILY_LOG draft-review logic (issue 0017) — the pure, framework-free core the
 * review UI is built on, kept separate so the select→confirm contract is unit-
 * testable in the node test env (no jsdom). All shapes come verbatim from the
 * serialized Contract in `lib/api/endpoints/dogs.ts` (ADR-0003).
 */

import type {
  DailyLogAdHocActionDraft,
  DailyLogCompletionDraft,
  DailyLogDraft,
  DailyLogObservationDraft
} from '@/lib/api/endpoints/dogs'

/** The three selectable item kinds (plan-change suggestions are inert, excluded). */
export type DailyLogGroup = 'completions' | 'adHocActions' | 'observations'

export type SelectableItem =
  | DailyLogCompletionDraft
  | DailyLogAdHocActionDraft
  | DailyLogObservationDraft

/** Every selectable item across the three groups, in display order. */
export function selectableItems(draft: DailyLogDraft): SelectableItem[] {
  return [...draft.completions, ...draft.adHocActions, ...draft.observations]
}

/** Every `changeId` that may legitimately be confirmed. */
export function selectableChangeIds(draft: DailyLogDraft): string[] {
  return selectableItems(draft).map(i => i.changeId)
}

/**
 * Pre-selection rule (ADR-0003 §3): confident items start selected; items flagged
 * `needsReview` are surfaced but NOT pre-selected — the caregiver opts them in.
 */
export function defaultSelectedChangeIds(draft: DailyLogDraft): string[] {
  return selectableItems(draft)
    .filter(i => !i.needsReview)
    .map(i => i.changeId)
}

/** A DAILY_LOG draft with nothing loggable (ADR-0003 §9 — empty-draft message). */
export function isEmptyDraft(draft: DailyLogDraft): boolean {
  return selectableItems(draft).length === 0
}

/**
 * The confirm payload's `selectedChangeIds`: the caller's selection, intersected
 * with the draft's real `changeId`s and de-duped. This is the guard that a
 * `planChangeSuggestion` (which has no `changeId`) can NEVER reach the commit —
 * only ids that belong to a selectable draft item survive.
 */
export function sanitizeSelectedChangeIds(
  selected: Iterable<string>,
  draft: DailyLogDraft
): string[] {
  const valid = new Set(selectableChangeIds(draft))
  const out: string[] = []
  const seen = new Set<string>()
  for (const id of selected) {
    if (valid.has(id) && !seen.has(id)) {
      seen.add(id)
      out.push(id)
    }
  }
  return out
}

export type ConfidenceTier = 'high' | 'medium' | 'low'

export function confidenceTier(confidence: number): ConfidenceTier {
  if (confidence >= 0.85) return 'high'
  if (confidence >= 0.65) return 'medium'
  return 'low'
}
