'use client'

import { useState } from 'react'
import { useApiClient } from '@/hooks/use-api-client'
import type {
  DailyCareActionRecord,
  DailyCareActionStatus,
  Tolerance
} from '@/lib/api/endpoints/dogs'
import { STATUS_COLORS, STATUS_LABELS, caregiverName } from '@/lib/care/display'

export function ActionRow({
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
          <p className="text-xs text-zinc-500 mt-0.5">
            {action.categorySnapshot.replace(/_/g, ' ')}
          </p>
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
