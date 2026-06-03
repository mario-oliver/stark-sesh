'use client'

import Link from 'next/link'
import { useCallback, useEffect, useState } from 'react'
import { MovementRow } from '@/components/care/MovementRow'
import { useApiClient } from '@/hooks/use-api-client'
import type { DailyCareActionRecord, TodayPayload } from '@/lib/api/endpoints/dogs'
import { STATUS_COLORS, STATUS_LABELS, formatDisplayDate, localDateString } from '@/lib/care/display'

export function ExerciseDetailClient({
  dogId,
  dailyActionId
}: {
  dogId: string
  dailyActionId: string
}) {
  const { apiClient, isReady } = useApiClient()
  const [exercise, setExercise] = useState<DailyCareActionRecord | null>(null)
  const [date, setDate] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const load = useCallback(async () => {
    if (!isReady) return
    const today = localDateString()
    try {
      const res = await apiClient.getToday(dogId, today)
      const payload: TodayPayload = res.data
      const found = payload.dailyLog.dailyCareActions.find(a => a.id === dailyActionId)
      if (!found) {
        setError('Exercise not found for today')
        setExercise(null)
      } else {
        setExercise(found)
        setDate(payload.date)
        setError(null)
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load exercise')
    } finally {
      setLoading(false)
    }
  }, [apiClient, isReady, dogId, dailyActionId])

  useEffect(() => {
    void load()
  }, [load])

  const updateExercise = async (status: 'COMPLETED' | 'SKIPPED') => {
    if (!isReady || !exercise) return
    setBusy(true)
    try {
      await apiClient.updateDailyAction(dogId, exercise.id, { status })
      await load()
    } finally {
      setBusy(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0c0c0c] text-zinc-100 flex items-center justify-center">
        <p className="text-zinc-500">Loading exercise…</p>
      </div>
    )
  }

  if (error || !exercise) {
    return (
      <div className="min-h-screen bg-[#0c0c0c] text-zinc-100 p-6">
        <p className="text-red-400">{error ?? 'Exercise not found'}</p>
        <Link
          href={`/dogs/${dogId}/today`}
          className="mt-4 inline-block text-amber-400 underline text-sm"
        >
          ← Back to today
        </Link>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0c0c0c] text-zinc-100 pb-32">
      <div className="max-w-lg mx-auto px-4 pt-6">
        <Link
          href={`/dogs/${dogId}/today`}
          className="text-sm text-amber-400 hover:text-amber-300 underline"
        >
          ← Exercises today
        </Link>

        <header className="mt-4 mb-6">
          <p className="text-xs uppercase tracking-widest text-zinc-500">Exercise</p>
          <h1 className="text-2xl font-semibold mt-1">{exercise.nameSnapshot}</h1>
          {date && <p className="text-sm text-zinc-500 mt-1">{formatDisplayDate(date)}</p>}
          <span
            className={`inline-block text-xs px-2 py-1 rounded-full mt-3 ${STATUS_COLORS[exercise.status]}`}
          >
            {STATUS_LABELS[exercise.status]}
          </span>
          {exercise.movementProgress && (
            <p className="text-sm text-amber-400/90 mt-2">
              {exercise.movementProgress.completed} of {exercise.movementProgress.total}{' '}
              movements done
            </p>
          )}
        </header>

        <section className="mb-8">
          <h2 className="text-xs uppercase tracking-widest text-zinc-500 mb-3">Movements</h2>
          <ul className="space-y-3">
            {exercise.steps.map(movement => (
              <MovementRow
                key={movement.id}
                movement={movement}
                dogId={dogId}
                onUpdated={load}
              />
            ))}
          </ul>
        </section>
      </div>

      <div className="fixed bottom-0 left-0 right-0 border-t border-zinc-800 bg-[#0c0c0c]/95 backdrop-blur p-4">
        <div className="max-w-lg mx-auto flex flex-wrap gap-2">
          {exercise.status !== 'COMPLETED' && (
            <button
              type="button"
              disabled={busy}
              onClick={() => void updateExercise('COMPLETED')}
              className="flex-1 min-w-[140px] text-sm px-4 py-2 rounded-lg bg-amber-600 text-black font-medium hover:bg-amber-500 disabled:opacity-50"
            >
              Mark entire exercise done
            </button>
          )}
          {exercise.status !== 'SKIPPED' && (
            <button
              type="button"
              disabled={busy}
              onClick={() => void updateExercise('SKIPPED')}
              className="text-sm px-4 py-2 rounded-lg border border-zinc-700 text-zinc-400 hover:text-zinc-200 disabled:opacity-50"
            >
              Skip exercise
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
