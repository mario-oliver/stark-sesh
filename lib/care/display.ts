import type { DailyCareActionStatus } from '@/lib/api/endpoints/dogs'

export function localDateString(date = new Date()) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function formatDisplayDate(dateStr: string) {
  const [y, m, d] = dateStr.split('-').map(Number)
  return new Date(y, m - 1, d).toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  })
}

export function shiftDateString(dateStr: string, days: number) {
  const [y, m, d] = dateStr.split('-').map(Number)
  const date = new Date(y, m - 1, d)
  date.setDate(date.getDate() + days)
  return localDateString(date)
}

export function monthString(date = new Date()) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  return `${y}-${m}`
}

export function parseDateString(dateStr: string) {
  const [y, m, d] = dateStr.split('-').map(Number)
  return new Date(y, m - 1, d)
}

export function caregiverName(user: {
  firstName: string | null
  lastName: string | null
  email: string
}) {
  const name = [user.firstName, user.lastName].filter(Boolean).join(' ')
  return name || user.email
}

export const STATUS_LABELS: Record<DailyCareActionStatus, string> = {
  PENDING: 'Pending',
  COMPLETED: 'Done',
  SKIPPED: 'Skipped',
  PARTIALLY_COMPLETED: 'Partial',
  UNCLEAR: 'Unclear'
}

export const STATUS_COLORS: Record<DailyCareActionStatus, string> = {
  PENDING: 'bg-secondary text-secondary-foreground',
  COMPLETED: 'bg-primary/15 text-primary ring-1 ring-primary/20',
  SKIPPED: 'bg-muted text-muted-foreground',
  PARTIALLY_COMPLETED: 'bg-accent text-accent-foreground',
  UNCLEAR: 'bg-destructive/10 text-destructive'
}
