'use client'

import { useState } from 'react'
import { useApiClient } from '@/hooks/use-api-client'
import type { DailyCareActionStepRecord, DailyCareActionStatus } from '@/lib/api/endpoints/dogs'
import { STATUS_COLORS, STATUS_LABELS, caregiverName } from '@/lib/care/display'

function MovementMedia({
  mediaUrl,
  mediaContentType
}: {
  mediaUrl: string | null
  mediaContentType: string | null
}) {
  if (!mediaUrl) return null
  const isVideo = mediaContentType?.startsWith('video/')

  if (isVideo) {
    return (
      <video
        src={mediaUrl}
        controls
        className="mt-3 w-full max-h-48 rounded-lg border border-zinc-800 bg-black"
      />
    )
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={mediaUrl}
      alt=""
      className="mt-3 w-full max-h-48 object-cover rounded-lg border border-zinc-800"
    />
  )
}

export function MovementRow({
  movement,
  dogId,
  onUpdated
}: {
  movement: DailyCareActionStepRecord
  dogId: string
  onUpdated: () => void
}) {
  const { apiClient, isReady } = useApiClient()
  const [editingNote, setEditingNote] = useState(false)
  const [note, setNote] = useState(movement.notes ?? '')
  const [busy, setBusy] = useState(false)

  const update = async (body: { status?: DailyCareActionStatus; notes?: string }) => {
    if (!isReady) return
    setBusy(true)
    try {
      await apiClient.updateDailyActionStep(dogId, movement.id, body)
      onUpdated()
    } finally {
      setBusy(false)
    }
  }

  return (
    <li className="border border-zinc-800 rounded-lg p-4 bg-zinc-900/40">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="font-medium text-zinc-100">{movement.nameSnapshot}</p>
          {movement.description && (
            <p className="text-sm text-zinc-400 mt-2">{movement.description}</p>
          )}
          {movement.instructions && (
            <p className="text-xs text-zinc-500 mt-2">{movement.instructions}</p>
          )}
          <MovementMedia
            mediaUrl={movement.mediaUrl}
            mediaContentType={movement.mediaContentType}
          />
        </div>
        <span
          className={`text-xs px-2 py-1 rounded-full shrink-0 ${STATUS_COLORS[movement.status]}`}
        >
          {STATUS_LABELS[movement.status]}
        </span>
      </div>

      {movement.notes && !editingNote && (
        <p className="text-sm text-zinc-400 mt-2">{movement.notes}</p>
      )}

      {movement.completedBy && (
        <p className="text-xs text-zinc-500 mt-2">By {caregiverName(movement.completedBy)}</p>
      )}

      <div className="flex flex-wrap gap-2 mt-3">
        {movement.status !== 'COMPLETED' && (
          <button
            type="button"
            disabled={busy}
            onClick={() => void update({ status: 'COMPLETED' })}
            className="text-xs px-2 py-1 rounded border border-zinc-700 text-zinc-400 hover:text-zinc-200"
          >
            Mark done
          </button>
        )}
        {movement.status !== 'SKIPPED' && (
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
