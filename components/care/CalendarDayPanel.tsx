'use client'

import { useCallback, useEffect, useState } from 'react'
import { ActionRow } from '@/components/care/ActionRow'
import { useApiClient } from '@/hooks/use-api-client'
import type { TodayPayload } from '@/lib/api/endpoints/dogs'
import { formatDisplayDate } from '@/lib/care/display'

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
    return <p className="text-sm text-zinc-500 py-4">Loading tasks…</p>
  }

  if (error && !payload) {
    return (
      <div className="py-4">
        <p className="text-sm text-red-400">{error}</p>
        <button type="button" onClick={() => void load()} className="text-sm text-amber-400 underline mt-2">
          Retry
        </button>
      </div>
    )
  }

  if (!payload) return null

  const { dailyLog, progress } = payload

  return (
    <div className="mt-4 border-t border-zinc-800 pt-4">
      <h3 className="text-sm font-medium text-zinc-200">{formatDisplayDate(date)}</h3>
      <p className="text-xs text-amber-400/90 mt-1">
        {progress.completed} of {progress.total} done
      </p>
      {dailyLog.dailyCareActions.length === 0 ? (
        <p className="text-sm text-zinc-500 mt-4">No tasks scheduled for this day.</p>
      ) : (
        <ul className="space-y-3 mt-4">
          {dailyLog.dailyCareActions.map(action => (
            <ActionRow
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
