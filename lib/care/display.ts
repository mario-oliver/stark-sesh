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
  PENDING: 'bg-zinc-700 text-zinc-300',
  COMPLETED: 'bg-emerald-900/60 text-emerald-300',
  SKIPPED: 'bg-zinc-800 text-zinc-400',
  PARTIALLY_COMPLETED: 'bg-amber-900/50 text-amber-300',
  UNCLEAR: 'bg-orange-900/50 text-orange-300'
}
