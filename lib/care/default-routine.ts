export const DEFAULT_ROUTINE_NAME = 'Mobility & strength routine'

// Bucket is the only categorization (ADR-0002). These onboarding preview rows label
// each example item by its bucket, not a legacy category.
export const DEFAULT_ROUTINE_ITEMS = [
  { name: 'Morning stretch routine', bucket: 'Mobility', frequency: 'Daily · morning' },
  { name: 'Evening stretch routine', bucket: 'Mobility', frequency: 'Daily · evening' },
  { name: 'Assisted strength workout', bucket: 'Activity', frequency: 'Every other day' },
  { name: 'Short controlled walk', bucket: 'Activity', frequency: 'Daily' },
  { name: 'Mobility/pain check', bucket: 'Recovery', frequency: 'Daily' }
] as const
