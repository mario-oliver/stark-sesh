'use client'

import Link from 'next/link'
import { useCallback, useEffect, useState } from 'react'
import { ExerciseCard } from '@/components/care/ExerciseCard'
import { DogHero } from '@/components/dog/DogHero'
import { DogSubNav } from '@/components/dog/DogSubNav'
import { VoiceRecordBar } from '@/components/voice/VoiceRecordBar'
import { Button } from '@/components/ui/button'
import { useApiClient } from '@/hooks/use-api-client'
import { useActiveDog } from '@/hooks/use-active-dog'
import type { HealthObservationRecord, TodayPayload, VoiceNoteRecord } from '@/lib/api/endpoints/dogs'
import { caregiverName, formatDisplayDate, formatTimestamp, localDateString } from '@/lib/care/display'

function VoiceNoteCard({ note }: { note: VoiceNoteRecord }) {
  const [expanded, setExpanded] = useState(false)
  return (
    <li className="border border-border rounded-lg p-3 bg-card/80 bg-gradient-to-br from-card to-accent/30">
      <div className="flex justify-between items-start gap-2">
        <p className="text-sm text-foreground line-clamp-2">{note.transcript || '(no transcript)'}</p>
        <span className="text-xs text-muted-foreground shrink-0">{note.processingStatus}</span>
      </div>
      {note.caregiverNote && <p className="text-xs text-primary mt-1">{note.caregiverNote}</p>}
      <p className="text-xs text-muted-foreground mt-1">
        {caregiverName(note.user)} · {formatTimestamp(note.createdAt)}
      </p>
      <Button
        type="button"
        variant="link"
        size="xs"
        onClick={() => setExpanded(v => !v)}
        className="mt-2 h-auto px-0"
      >
        {expanded ? 'Hide details' : 'View transcript'}
      </Button>
      {expanded && <pre className="text-xs text-muted-foreground mt-2 whitespace-pre-wrap">{note.transcript}</pre>}
      {expanded && note.extraction != null && (
        <pre className="text-xs text-muted-foreground mt-2 overflow-x-auto">
          {JSON.stringify(note.extraction, null, 2)}
        </pre>
      )}
    </li>
  )
}

function ObservationCard({ obs }: { obs: HealthObservationRecord }) {
  return (
    <li className="border border-border rounded-lg p-3 bg-card/80 bg-gradient-to-br from-card to-accent/30">
      <p className="text-sm font-medium text-foreground">
        {obs.type.replace(/_/g, ' ')}
        {obs.severity && <span className="text-muted-foreground font-normal"> · {obs.severity.toLowerCase()}</span>}
      </p>
      <p className="text-sm text-muted-foreground mt-1">{obs.note}</p>
      {obs.bodyArea && <p className="text-xs text-muted-foreground mt-1">{obs.bodyArea}</p>}
      <p className="text-xs text-muted-foreground mt-1">
        {caregiverName(obs.user)} · {formatTimestamp(obs.observedAt ?? obs.createdAt)}
      </p>
    </li>
  )
}

export function TodayPageClient({ dogId }: { dogId: string }) {
  const { apiClient, isReady } = useApiClient()
  useActiveDog(dogId)
  const [payload, setPayload] = useState<TodayPayload | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isTranscribing, setIsTranscribing] = useState(false)
  const date = localDateString()

  const loadToday = useCallback(async () => {
    if (!isReady) return
    try {
      const res = await apiClient.getToday(dogId, date)
      setPayload(res.data)
      setError(null)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load today')
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
      const data = res.data
      setPayload({
        dog: data.dog,
        date: data.date,
        dailyLog: data.dailyLog,
        progress: data.progress
      })
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Recording failed')
    } finally {
      setIsTranscribing(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
        <p className="text-muted-foreground">Loading today&apos;s care…</p>
      </div>
    )
  }

  if (error && !payload) {
    return (
      <div className="min-h-screen bg-background text-foreground p-6">
        <p className="text-destructive">{error}</p>
        <Button type="button" variant="link" onClick={() => void loadToday()} className="mt-4 px-0">
          Retry
        </Button>
      </div>
    )
  }

  if (!payload) return null

  const { dog, dailyLog, progress } = payload

  return (
    <div className="min-h-screen bg-background text-foreground pb-44">
      <div className="max-w-lg mx-auto px-4 pt-6 pb-6">
        <Link href="/today" className="text-sm text-primary hover:text-primary/80 underline">
          ← Care
        </Link>

        <header className="mt-4 mb-2 flex flex-col items-center text-center">
          <p className="text-xs uppercase tracking-widest text-accent-foreground font-medium w-full text-left">
            Care
          </p>
          <div className="mt-3 w-full">
            <DogHero dogId={dog.id} photoUrl={dog.photoUrl} name={dog.name} />
          </div>
          <p className="text-muted-foreground text-sm mt-4">{formatDisplayDate(payload.date)}</p>
          <p className="text-primary font-medium text-sm mt-2 bg-secondary/80 rounded-full px-4 py-1">
            {progress.completed} of {progress.total} exercises done
          </p>
          {dailyLog.summary && (
            <p className="text-sm text-muted-foreground mt-3 border-l-2 border-accent-foreground pl-3 text-left w-full">
              {dailyLog.summary}
            </p>
          )}
        </header>

        <DogSubNav dogId={dogId} />

        {error && <p className="text-destructive text-sm mb-4">{error}</p>}

        <section className="mb-10">
          <h2 className="text-xs uppercase tracking-widest text-muted-foreground mb-3">Exercises today</h2>
          <p className="text-xs text-muted-foreground mb-4">
            Speak your update below — tap an exercise to expand and see details.
          </p>
          <ul className="space-y-4">
            {dailyLog.dailyCareActions.map(action => (
              <ExerciseCard key={action.id} action={action} dogId={dogId} onUpdated={loadToday} />
            ))}
          </ul>
        </section>

        {dailyLog.healthObservations.length > 0 && (
          <section className="mb-10">
            <h2 className="text-xs uppercase tracking-widest text-muted-foreground mb-3">Observations</h2>
            <ul className="space-y-3">
              {dailyLog.healthObservations.map(obs => (
                <ObservationCard key={obs.id} obs={obs} />
              ))}
            </ul>
          </section>
        )}

        {dailyLog.voiceNotes.length > 0 && (
          <section className="mb-10">
            <h2 className="text-xs uppercase tracking-widest text-muted-foreground mb-3">Voice updates</h2>
            <ul className="space-y-3">
              {dailyLog.voiceNotes.map(note => (
                <VoiceNoteCard key={note.id} note={note} />
              ))}
            </ul>
          </section>
        )}

        <footer className="text-xs text-muted-foreground border-t border-border pt-4 mt-8">
          Stark Health helps organize care notes and PT routines. It does not provide veterinary medical advice.
        </footer>
      </div>

      <VoiceRecordBar
        isProcessing={isTranscribing || hasProcessingNotes}
        onRecordingComplete={handleRecording}
        hint="Record Update — say what Stark did today."
      />
    </div>
  )
}
