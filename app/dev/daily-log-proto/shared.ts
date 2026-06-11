/** THROWAWAY shared helpers for the 0016 prototype playground. */

import type {
  AdHocActionDraft,
  CareBucket,
  CompletionDraft,
  DailyLogDraft,
  ObservationDraft,
  ObservationType,
  Severity,
  Tolerance
} from './fixtures'

export const BUCKET_LABEL: Record<CareBucket, string> = {
  ACTIVITY: 'Activity',
  MOBILITY: 'Mobility',
  RECOVERY: 'Recovery'
}

/** A draft item is any of the three selectable kinds (plan changes are inert). */
export type DraftItem = CompletionDraft | AdHocActionDraft | ObservationDraft

/** Pre-selection rule (ADR-0003 §3): confident items in, flagged items opt-in. */
export function defaultSelected(draft: DailyLogDraft): Set<string> {
  const ids = [...draft.completions, ...draft.adHocActions, ...draft.observations]
    .filter(i => !i.needsReview)
    .map(i => i.changeId)
  return new Set(ids)
}

export function totalSelectable(draft: DailyLogDraft): number {
  return draft.completions.length + draft.adHocActions.length + draft.observations.length
}

export function confidenceLabel(c: number): 'high' | 'medium' | 'low' {
  if (c >= 0.85) return 'high'
  if (c >= 0.65) return 'medium'
  return 'low'
}

export function pct(c: number): string {
  return `${Math.round(c * 100)}%`
}

export function formatDuration(seconds?: number): string | null {
  if (seconds == null) return null
  const min = Math.round(seconds / 60)
  return `${min} min`
}

/** Human one-liner for the measured actuals of a completion / ad-hoc item. */
export function actualsLine(item: {
  actualReps?: number
  actualDurationSeconds?: number
  tolerance?: Tolerance
}): string | null {
  const parts: string[] = []
  if (item.actualReps != null) parts.push(`${item.actualReps} reps`)
  const dur = formatDuration(item.actualDurationSeconds)
  if (dur) parts.push(dur)
  if (item.tolerance) parts.push(`tolerated ${item.tolerance.toLowerCase()}`)
  return parts.length ? parts.join(' · ') : null
}

export function observationTitle(type: ObservationType, severity?: Severity): string {
  const t = type.replace(/_/g, ' ').toLowerCase()
  return severity ? `${t} · ${severity.toLowerCase()}` : t
}
