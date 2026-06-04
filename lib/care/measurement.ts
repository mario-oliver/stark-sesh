export type MeasurementMode = 'checklist' | 'timer' | 'reps' | 'both'

export function getMeasurementMode(
  targetReps: number | null | undefined,
  targetDurationSeconds: number | null | undefined
): MeasurementMode {
  const hasReps = targetReps != null && targetReps > 0
  const hasTimer = targetDurationSeconds != null && targetDurationSeconds > 0
  if (hasTimer && hasReps) return 'both'
  if (hasTimer) return 'timer'
  if (hasReps) return 'reps'
  return 'checklist'
}

export function formatCountdown(totalSeconds: number): string {
  const safe = Math.max(0, Math.floor(totalSeconds))
  const minutes = Math.floor(safe / 60)
  const seconds = safe % 60
  return `${minutes}:${String(seconds).padStart(2, '0')}`
}
