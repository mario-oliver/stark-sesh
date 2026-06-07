'use client'

import Link from 'next/link'
import { useCallback, useEffect, useState } from 'react'
import { BucketScoreCard } from '@/components/care/BucketScoreCard'
import { ObservationRow } from '@/components/care/ObservationRow'
import { TaskRow } from '@/components/care/TaskRow'
import { DogSubNav } from '@/components/dog/DogSubNav'
import { SpriteOverlay } from '@/components/sprite/SpriteOverlay'
import { VoiceRecordBar } from '@/components/voice/VoiceRecordBar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useApiClient } from '@/hooks/use-api-client'
import { useActiveDog } from '@/hooks/use-active-dog'
import type { BucketPayload, CareBucket, TodayPayload } from '@/lib/api/endpoints/dogs'
import { formatDisplayDate, localDateString } from '@/lib/care/display'

const BUCKET_TITLES: Record<CareBucket, string> = {
  ACTIVITY: 'Activity',
  MOBILITY: 'Mobility',
  RECOVERY: 'Recovery'
}

export function BucketDetailClient({
  dogId,
  bucket
}: {
  dogId: string
  bucket: CareBucket
}) {
  const { apiClient, isReady } = useApiClient()
  useActiveDog(dogId)
  const [payload, setPayload] = useState<TodayPayload | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isTranscribing, setIsTranscribing] = useState(false)
  const [addingTask, setAddingTask] = useState(false)
  const [newTaskName, setNewTaskName] = useState('')
  const date = localDateString()

  const loadToday = useCallback(async () => {
    if (!isReady) return
    try {
      const res = await apiClient.getToday(dogId, date)
      setPayload(res.data)
      setError(null)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load')
    } finally {
      setLoading(false)
    }
  }, [apiClient, isReady, dogId, date])

  useEffect(() => {
    void loadToday()
  }, [loadToday])

  const hasProcessingNotes =
    payload?.dailyLog.voiceNotes.some(n => n.processingStatus === 'PENDING' || n.processingStatus === 'TRANSCRIBED') ??
    false

  useEffect(() => {
    if (!hasProcessingNotes || !isReady) return
    const id = setInterval(() => void loadToday(), 2000)
    return () => clearInterval(id)
  }, [hasProcessingNotes, isReady, loadToday])

  const handleRecording = async (wavBlob: Blob) => {
    if (!isReady) return
    setIsTranscribing(true)
    try {
      const res = await apiClient.transcribeVoiceNote(dogId, wavBlob, { date })
      setPayload(res.data)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Recording failed')
    } finally {
      setIsTranscribing(false)
    }
  }

  const handleAddTask = async () => {
    if (!isReady || !newTaskName.trim() || !payload) return
    try {
      await apiClient.createDailyTask(dogId, {
        dailyCareLogId: payload.dailyLog.id,
        bucket,
        name: newTaskName.trim()
      })
      setNewTaskName('')
      setAddingTask(false)
      await loadToday()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to add task')
    }
  }

  if (loading) {
    return <SpriteOverlay preset="dailyPlanLoading" mode="blocking" />
  }

  if (!payload) return null

  const bucketKey = bucket.toLowerCase() as 'activity' | 'mobility' | 'recovery'
  const bucketData: BucketPayload = payload.buckets[bucketKey]
  const scoreUpdating =
    hasProcessingNotes ||
    (payload.dailyLog.latestVoiceNoteAt &&
      payload.dailyLog.scoreComputedAt &&
      payload.dailyLog.latestVoiceNoteAt > payload.dailyLog.scoreComputedAt)

  return (
    <div className="min-h-screen bg-background text-foreground pb-44">
      <div className="max-w-lg mx-auto px-4 pt-6 pb-6">
        <Link
          href={`/dogs/${dogId}/today`}
          className="text-sm text-primary hover:text-primary/80 underline"
        >
          ← Today
        </Link>

        <header className="mt-4 mb-6">
          <h1 className="text-xl font-semibold">{BUCKET_TITLES[bucket]}</h1>
          <p className="text-sm text-muted-foreground mt-1">{formatDisplayDate(payload.date)}</p>
          {bucket !== 'RECOVERY' && bucketData.progress && bucketData.progress.total > 0 && (
            <p className="text-sm text-primary mt-2">
              {bucketData.progress.completed} of {bucketData.progress.total} complete
            </p>
          )}
        </header>

        <DogSubNav dogId={dogId} />

        {error && <p className="text-destructive text-sm mb-4">{error}</p>}

        {(bucket === 'RECOVERY' || bucket === 'MOBILITY') && (
          <BucketScoreCard
            title={bucket === 'RECOVERY' ? 'Recovery score' : 'Mobility score'}
            score={bucketData.score}
            updating={!!scoreUpdating}
            className="mb-6"
          />
        )}

        {bucket === 'ACTIVITY' && bucketData.score && (
          <BucketScoreCard title="Activity score" score={bucketData.score} className="mb-6" />
        )}

        <section className="mb-8">
          <h2 className="text-xs uppercase tracking-widest text-muted-foreground mb-3">Tasks</h2>
          <ul className="space-y-3">
            {bucketData.tasks.map(task => (
              <TaskRow key={task.id} task={task} dogId={dogId} onUpdated={loadToday} />
            ))}
          </ul>
          {bucketData.tasks.length === 0 && (
            <p className="text-sm text-muted-foreground">No tasks yet for this bucket.</p>
          )}
        </section>

        {bucketData.observations.length > 0 && (
          <section className="mb-8">
            <h2 className="text-xs uppercase tracking-widest text-muted-foreground mb-3">
              Observations
            </h2>
            <ul className="space-y-3">
              {bucketData.observations.map(obs => (
                <ObservationRow key={obs.id} observation={obs} />
              ))}
            </ul>
          </section>
        )}

        <section className="mb-8">
          {addingTask ? (
            <div className="flex gap-2">
              <Input
                value={newTaskName}
                onChange={e => setNewTaskName(e.target.value)}
                placeholder="Task name"
                className="flex-1"
              />
              <Button type="button" size="sm" onClick={() => void handleAddTask()}>
                Add
              </Button>
              <Button type="button" size="sm" variant="ghost" onClick={() => setAddingTask(false)}>
                Cancel
              </Button>
            </div>
          ) : (
            <Button type="button" variant="outline" size="sm" onClick={() => setAddingTask(true)}>
              Add manually
            </Button>
          )}
        </section>
      </div>

      <VoiceRecordBar
        isProcessing={isTranscribing || hasProcessingNotes}
        onRecordingComplete={handleRecording}
        hint="Record update — say what happened today."
      />

      {(isTranscribing || hasProcessingNotes) && (
        <SpriteOverlay preset="voiceProcessing" />
      )}
    </div>
  )
}
