import type {
  CareActionFrequency,
  CareActionTimeOfDay,
  CareBucket
} from '@/lib/api/endpoints/dogs'

export const BUCKET_LABELS: Record<CareBucket, string> = {
  ACTIVITY: 'Activity',
  MOBILITY: 'Mobility',
  RECOVERY: 'Recovery'
}

export const BUCKET_OPTIONS = Object.entries(BUCKET_LABELS).map(([value, label]) => ({
  value: value as CareBucket,
  label
}))

export const FREQUENCY_LABELS: Record<CareActionFrequency, string> = {
  DAILY: 'Daily',
  EVERY_OTHER_DAY: 'Every other day',
  WEEKLY: 'Weekly',
  AS_NEEDED: 'As needed'
}

export const TIME_OF_DAY_LABELS: Record<CareActionTimeOfDay, string> = {
  MORNING: 'Morning',
  EVENING: 'Evening',
  ANYTIME: 'Anytime'
}

export const FREQUENCY_OPTIONS = Object.entries(FREQUENCY_LABELS).map(([value, label]) => ({
  value: value as CareActionFrequency,
  label
}))

export const TIME_OF_DAY_OPTIONS = Object.entries(TIME_OF_DAY_LABELS).map(([value, label]) => ({
  value: value as CareActionTimeOfDay,
  label
}))

export function formatScheduleLabel(
  frequency: CareActionFrequency,
  timeOfDay: CareActionTimeOfDay | null
): string {
  const freq = FREQUENCY_LABELS[frequency]
  if (timeOfDay && timeOfDay !== 'ANYTIME') {
    return `${freq} · ${TIME_OF_DAY_LABELS[timeOfDay].toLowerCase()}`
  }
  return freq
}
