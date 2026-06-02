'use client'

import Link from 'next/link'
import { useCallback, useEffect, useState } from 'react'
import { DogPhoto } from '@/components/dog/DogPhoto'
import { VoiceRecordBar } from '@/components/voice/VoiceRecordBar'
import { useApiClient } from '@/hooks/use-api-client'
import type {
  DailyCareActionRecord,
  DailyCareActionStatus,
  HealthObservationRecord,
  TodayPayload,
  Tolerance,
  VoiceNoteRecord
} from '@/lib/api/endpoints/dogs'

function localDateString() {
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function formatDisplayDate(dateStr: string) {
  const [y, m, d] = dateStr.split('-').map(Number)
  return new Date(y, m - 1, d).toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  })
}

function caregiverName(user: { firstName: string | null; lastName: string | null; email: string }) {
  const name = [user.firstName, user.lastName].filter(Boolean).join(' ')
  return name || user.email
}

const STATUS_LABELS: Record<DailyCareActionStatus, string> = {
  PENDING: 'Pending',
  COMPLETED: 'Done',
  SKIPPED: 'Skipped',
  PARTIALLY_COMPLETED: 'Partial',
  UNCLEAR: 'Unclear'
}

const STATUS_COLORS: Record<DailyCareActionStatus, string> = {
  PENDING: 'bg-zinc-700 text-zinc-300',
  COMPLETED: 'bg-emerald-900/60 text-emerald-300',
  SKIPPED: 'bg-zinc-800 text-zinc-400',
  PARTIALLY_COMPLETED: 'bg-amber-900/50 text-amber-300',
  UNCLEAR: 'bg-orange-900/50 text-orange-300'
}

function ActionRow({
  action,
  dogId,
  onUpdated
}: {
  action: DailyCareActionRecord
  dogId: string
  onUpdated: () => void
}) {
  const { apiClient, isReady } = useApiClient()
  const [editingNote, setEditingNote] = useState(false)
  const [note, setNote] = useState(action.notes ?? '')
  const [busy, setBusy] = useState(false)

  const update = async (body: {
    status?: DailyCareActionStatus
    notes?: string
    tolerance?: Tolerance | null
  }) => {
    if (!isReady) return
    setBusy(true)
    try {
      await apiClient.updateDailyAction(dogId, action.id, body)
      onUpdated()
    } finally {
      setBusy(false)
    }
  }

  return (
    <li className="border border-zinc-800 rounded-lg p-4 bg-zinc-900/40">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-medium text-zinc-100">{action.nameSnapshot}</p>
          <p className="text-xs text-zinc-500 mt-0.5">{action.categorySnapshot.replace(/_/g, ' ')}</p>
        </div>
        <span className={`text-xs px-2 py-1 rounded-full shrink-0 ${STATUS_COLORS[action.status]}`}>
          {STATUS_LABELS[action.status]}
        </span>
      </div>

      {(action.tolerance || action.issueObserved) && (
        <p className="text-sm text-zinc-400 mt-2">
          {action.tolerance && <span>Tolerance: {action.tolerance.toLowerCase()}. </span>}
          {action.issueObserved && <span className="text-amber-400">Issue noted.</span>}
        </p>
      )}

      {action.notes && !editingNote && (
        <p className="text-sm text-zinc-400 mt-2">{action.notes}</p>
      )}

      {action.completedBy && (
        <p className="text-xs text-zinc-500 mt-2">By {caregiverName(action.completedBy)}</p>
      )}

      <div className="flex flex-wrap gap-2 mt-3">
        {action.status !== 'COMPLETED' && (
          <button
            type="button"
            disabled={busy}
            onClick={() => void update({ status: 'COMPLETED' })}
            className="text-xs px-2 py-1 rounded border border-zinc-700 text-zinc-400 hover:text-zinc-200"
          >
            Mark done
          </button>
        )}
        {action.status !== 'SKIPPED' && (
          <button
            type="button"
            disabled={busy}
            onClick={() => void update({ status: 'SKIPPED' })}
            className="text-xs px-2 py-1 rounded border border-zinc-700 text-zinc-400 hover:text-zinc-200"
          >
            Skip
          </button>
        )}
        <button
          type="button"
          onClick={() => setEditingNote(v => !v)}
          className="text-xs px-2 py-1 rounded border border-zinc-700 text-zinc-400 hover:text-zinc-200"
        >
          {editingNote ? 'Cancel' : 'Note'}
        </button>
      </div>

      {editingNote && (
        <div className="mt-2 flex gap-2">
          <input
            value={note}
            onChange={e => setNote(e.target.value)}
            className="flex-1 bg-zinc-800 border border-zinc-700 rounded px-2 py-1 text-sm text-zinc-200"
            placeholder="Add a note"
          />
          <button
            type="button"
            disabled={busy}
            onClick={() => void update({ notes: note }).then(() => setEditingNote(false))}
            className="text-xs px-2 py-1 rounded bg-amber-600 text-black"
          >
            Save
          </button>
        </div>
      )}
    </li>
  )
}

function VoiceNoteCard({ note }: { note: VoiceNoteRecord }) {
  const [expanded, setExpanded] = useState(false)
  return (
    <li className="border border-zinc-800 rounded-lg p-3 bg-zinc-900/30">
      <div className="flex justify-between items-start gap-2">
        <p className="text-sm text-zinc-300 line-clamp-2">{note.transcript || '(no transcript)'}</p>
        <span className="text-xs text-zinc-500 shrink-0">{note.processingStatus}</span>
      </div>
      {note.caregiverNote && (
        <p className="text-xs text-amber-400/90 mt-1">{note.caregiverNote}</p>
      )}
      <p className="text-xs text-zinc-600 mt-1">{caregiverName(note.user)}</p>
      <button
        type="button"
        onClick={() => setExpanded(v => !v)}
        className="text-xs text-amber-500 mt-2 underline"
      >
        {expanded ? 'Hide details' : 'View transcript'}
      </button>
      {expanded && (
        <pre className="text-xs text-zinc-500 mt-2 whitespace-pre-wrap">{note.transcript}</pre>
      )}
      {expanded && note.extraction != null && (
        <pre className="text-xs text-zinc-600 mt-2 overflow-x-auto">
          {JSON.stringify(note.extraction, null, 2)}
        </pre>
      )}
    </li>
  )
}

function ObservationCard({ obs }: { obs: HealthObservationRecord }) {
  return (
    <li className="border border-zinc-800 rounded-lg p-3 bg-zinc-900/30">
      <p className="text-sm font-medium text-zinc-200">
        {obs.type.replace(/_/g, ' ')}
        {obs.severity && <span className="text-zinc-500 font-normal"> · {obs.severity.toLowerCase()}</span>}
      </p>
      <p className="text-sm text-zinc-400 mt-1">{obs.note}</p>
      {obs.bodyArea && <p className="text-xs text-zinc-500 mt-1">{obs.bodyArea}</p>}
      <p className="text-xs text-zinc-600 mt-1">{caregiverName(obs.user)}</p>
    </li>
  )
}

export function TodayPageClient({ dogId }: { dogId: string }) {
  const { apiClient, isReady } = useApiClient()
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
    payload?.dailyLog.voiceNotes.some(
      n => n.processingStatus === 'PENDING' || n.processingStatus === 'TRANSCRIBED'
    ) ?? false

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
      <div className="min-h-screen bg-[#0c0c0c] text-zinc-100 flex items-center justify-center">
        <p className="text-zinc-500">Loading today&apos;s care…</p>
      </div>
    )
  }

  if (error && !payload) {
    return (
      <div className="min-h-screen bg-[#0c0c0c] text-zinc-100 p-6">
        <p className="text-red-400">{error}</p>
        <button type="button" onClick={() => void loadToday()} className="mt-4 text-amber-400 underline">
          Retry
        </button>
      </div>
    )
  }

  if (!payload) return null

  const { dog, dailyLog, progress } = payload

  return (
    <div className="min-h-screen bg-[#0c0c0c] text-zinc-100 pb-40">
      <div className="max-w-lg mx-auto px-4 pt-6">
        <Link href="/today" className="text-sm text-amber-400 hover:text-amber-300 underline">
          ← Home
        </Link>

        <header className="mt-4 mb-6">
          <p className="text-xs uppercase tracking-widest text-zinc-500">Today</p>
          <div className="flex items-center gap-4 mt-1">
            <DogPhoto dogId={dog.id} photoUrl={dog.photoUrl} name={dog.name} size="xl" />
            <h1 className="text-2xl font-semibold">{dog.name}</h1>
          </div>
          <p className="text-zinc-400 text-sm mt-1">{formatDisplayDate(payload.date)}</p>
          <p className="text-amber-400/90 text-sm mt-2">
            {progress.completed} of {progress.total} care actions done
          </p>
          {dailyLog.summary && (
            <p className="text-sm text-zinc-400 mt-3 border-l-2 border-amber-600 pl-3">{dailyLog.summary}</p>
          )}
        </header>

        {error && <p className="text-red-400 text-sm mb-4">{error}</p>}

        <section className="mb-8">
          <h2 className="text-xs uppercase tracking-widest text-zinc-500 mb-3">PT work today</h2>
          <p className="text-xs text-zinc-600 mb-3">
            Speak your update below — manual controls are fallback only.
          </p>
          <ul className="space-y-3">
            {dailyLog.dailyCareActions.map(action => (
              <ActionRow key={action.id} action={action} dogId={dogId} onUpdated={loadToday} />
            ))}
          </ul>
        </section>

        {dailyLog.healthObservations.length > 0 && (
          <section className="mb-8">
            <h2 className="text-xs uppercase tracking-widest text-zinc-500 mb-3">Observations</h2>
            <ul className="space-y-2">
              {dailyLog.healthObservations.map(obs => (
                <ObservationCard key={obs.id} obs={obs} />
              ))}
            </ul>
          </section>
        )}

        {dailyLog.voiceNotes.length > 0 && (
          <section className="mb-8">
            <h2 className="text-xs uppercase tracking-widest text-zinc-500 mb-3">Voice updates</h2>
            <ul className="space-y-2">
              {dailyLog.voiceNotes.map(note => (
                <VoiceNoteCard key={note.id} note={note} />
              ))}
            </ul>
          </section>
        )}

        <footer className="text-xs text-zinc-600 border-t border-zinc-800 pt-4 mt-8">
          Stark Health helps organize care notes and PT routines. It does not provide veterinary medical
          advice.
        </footer>

        <div className="flex gap-4 mt-4 text-sm">
          <Link href={`/dogs/${dogId}/profile`} className="text-zinc-500 hover:text-zinc-300 underline">
            Profile
          </Link>
          <Link href={`/dogs/${dogId}/history`} className="text-zinc-500 hover:text-zinc-300 underline">
            History
          </Link>
        </div>
      </div>

      <VoiceRecordBar
        isProcessing={isTranscribing || hasProcessingNotes}
        onRecordingComplete={handleRecording}
        hint="Record Update — say what Stark did today."
      />
    </div>
  )
}
