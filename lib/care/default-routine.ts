export const DEFAULT_ROUTINE_NAME = 'Mobility & strength routine'

export const DEFAULT_ROUTINE_ITEMS = [
  { name: 'Morning stretch routine', category: 'Stretch', frequency: 'Daily · morning' },
  { name: 'Evening stretch routine', category: 'Stretch', frequency: 'Daily · evening' },
  { name: 'Assisted strength workout', category: 'Strength', frequency: 'Every other day' },
  { name: 'Short controlled walk', category: 'Mobility', frequency: 'Daily' },
  { name: 'Mobility/pain check', category: 'Checkpoint', frequency: 'Daily' }
] as const
