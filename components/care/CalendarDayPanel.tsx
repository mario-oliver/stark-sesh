'use client'

import { useCallback, useEffect, useState } from 'react'
import { ExerciseCard } from '@/components/care/ExerciseCard'
import { useApiClient } from '@/hooks/use-api-client'
import type { TodayPayload } from '@/lib/api/endpoints/dogs'
import { formatDisplayDate } from '@/lib/care/display'
import { Button } from '@/components/ui/button'

export function CalendarDayPanel({
  dogId,
  date,
  onUpdated
}: {
  dogId: string
  date: string
  onUpdated?: () => void
}) {
  const { apiClient, isReady } = useApiClient()
  const [payload, setPayload] = useState<TodayPayload | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!isReady) return
    setLoading(true)
    try {
      const res = await apiClient.getToday(dogId, date)
      setPayload(res.data)
      setError(null)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load day')
    } finally {
      setLoading(false)
    }
  }, [apiClient, isReady, dogId, date])

  useEffect(() => {
    void load()
  }, [load])

  const handleUpdated = () => {
    void load()
    onUpdated?.()
  }

  if (loading) {
    return <p className="text-sm text-muted-foreground py-4">Loading tasks…</p>
  }

  if (error && !payload) {
    return (
      <div className="py-4">
        <p className="text-sm text-destructive">{error}</p>
        <Button type="button" variant="link" onClick={() => void load()} className="mt-2 h-auto px-0">
          Retry
        </Button>
      </div>
    )
  }

  if (!payload) return null

  const { dailyLog, progress } = payload

  return (
    <div className="mt-4 border-t border-border pt-4">
      <h3 className="text-sm font-medium text-foreground">{formatDisplayDate(date)}</h3>
      <p className="text-xs text-primary mt-1">
        {progress.completed} of {progress.total} done
      </p>
      {dailyLog.dailyCareActions.length === 0 ? (
        <p className="text-sm text-muted-foreground mt-4">No tasks scheduled for this day.</p>
      ) : (
        <ul className="space-y-3 mt-4">
          {dailyLog.dailyCareActions.map(action => (
            <ExerciseCard
              key={action.id}
              action={action}
              dogId={dogId}
              onUpdated={handleUpdated}
            />
          ))}
        </ul>
      )}
    </div>
  )
}
