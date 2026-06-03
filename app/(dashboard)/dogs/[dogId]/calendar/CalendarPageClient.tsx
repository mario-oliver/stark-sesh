'use client'

import Link from 'next/link'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { CalendarDayPanel } from '@/components/care/CalendarDayPanel'
import { DogSubNav } from '@/components/dog/DogSubNav'
import { Calendar } from '@/components/ui/calendar'
import { useApiClient } from '@/hooks/use-api-client'
import type { CalendarDaySummary } from '@/lib/api/endpoints/dogs'
import { localDateString, monthString, parseDateString } from '@/lib/care/display'

function dayStatus(day: CalendarDaySummary | undefined) {
  if (!day || day.totalActions === 0) return 'none'
  if (day.completedCount >= day.totalActions) return 'complete'
  if (day.completedCount > 0) return 'partial'
  return 'pending'
}

export function CalendarPageClient({
  dogId,
  initialDate
}: {
  dogId: string
  initialDate?: string
}) {
  const { apiClient, isReady } = useApiClient()
  const today = localDateString()
  const [selectedDate, setSelectedDate] = useState(initialDate ?? today)
  const [visibleMonth, setVisibleMonth] = useState(
    initialDate ? initialDate.slice(0, 7) : monthString()
  )
  const [days, setDays] = useState<CalendarDaySummary[]>([])
  const [loading, setLoading] = useState(true)

  const dayMap = useMemo(() => new Map(days.map(d => [d.date, d])), [days])

  const loadCalendar = useCallback(async () => {
    if (!isReady) return
    setLoading(true)
    try {
      const res = await apiClient.getCalendar(dogId, visibleMonth)
      setDays(res.data.days)
    } finally {
      setLoading(false)
    }
  }, [apiClient, isReady, dogId, visibleMonth])

  useEffect(() => {
    void loadCalendar()
  }, [loadCalendar])

  const selected = parseDateString(selectedDate)
  const calendarMonth = parseDateString(`${visibleMonth}-01`)

  const modifiers = useMemo(() => {
    const complete: Date[] = []
    const partial: Date[] = []
    const pending: Date[] = []

    for (const day of days) {
      const date = parseDateString(day.date)
      const status = dayStatus(day)
      if (status === 'complete') complete.push(date)
      else if (status === 'partial') partial.push(date)
      else if (status === 'pending' && day.totalActions > 0 && day.date < today) pending.push(date)
    }

    return { complete, partial, pendingPast: pending }
  }, [days, today])

  return (
    <div className="min-h-screen bg-background text-foreground pb-12">
      <div className="max-w-lg mx-auto px-4 pt-6">
        <Link href="/today" className="text-sm text-primary hover:text-primary/80 underline">
          ← Home
        </Link>

        <header className="mt-4 mb-2">
          <h1 className="text-2xl font-semibold">Calendar</h1>
          <p className="text-sm text-muted-foreground mt-1">Track care tasks over time</p>
        </header>

        <DogSubNav dogId={dogId} />

        <div className="flex flex-wrap gap-4 text-xs text-muted-foreground mb-4">
          <span className="flex items-center gap-1.5">
            <span className="size-2 rounded-full bg-primary" /> All done
          </span>
          <span className="flex items-center gap-1.5">
            <span className="size-2 rounded-full bg-primary/60" /> Partial
          </span>
          <span className="flex items-center gap-1.5">
            <span className="size-2 rounded-full bg-muted-foreground" /> Missed
          </span>
        </div>

        <div className="relative">
          {loading && (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/60 rounded-lg">
              <p className="text-sm text-muted-foreground">Loading…</p>
            </div>
          )}
          <Calendar
            mode="single"
            selected={selected}
            month={calendarMonth}
            onMonthChange={date => setVisibleMonth(monthString(date))}
            onSelect={date => {
              if (date) setSelectedDate(localDateString(date))
            }}
            modifiers={modifiers}
            modifiersClassNames={{
              complete: 'relative after:absolute after:bottom-1 after:left-1/2 after:-translate-x-1/2 after:size-1.5 after:rounded-full after:bg-primary',
              partial: 'relative after:absolute after:bottom-1 after:left-1/2 after:-translate-x-1/2 after:size-1.5 after:rounded-full after:bg-primary/60',
              pendingPast: 'relative after:absolute after:bottom-1 after:left-1/2 after:-translate-x-1/2 after:size-1.5 after:rounded-full after:bg-muted-foreground'
            }}
            className="mx-auto"
          />
        </div>

        {selectedDate && (
          <CalendarDayPanel
            dogId={dogId}
            date={selectedDate}
            onUpdated={loadCalendar}
          />
        )}

        {selectedDate && dayMap.has(selectedDate) && (
          <p className="text-xs text-muted-foreground mt-2 text-center">
            {dayMap.get(selectedDate)!.completedCount} of {dayMap.get(selectedDate)!.totalActions}{' '}
            tasks done
          </p>
        )}
      </div>
    </div>
  )
}
