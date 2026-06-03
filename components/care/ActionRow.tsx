'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
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
    <li className="border border-border rounded-lg p-4 bg-card">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-medium text-foreground">{action.nameSnapshot}</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {action.categorySnapshot.replace(/_/g, ' ')}
          </p>
        </div>
        <span className={`text-xs px-2 py-1 rounded-full shrink-0 ${STATUS_COLORS[action.status]}`}>
          {STATUS_LABELS[action.status]}
        </span>
      </div>

      {(action.tolerance || action.issueObserved) && (
        <p className="text-sm text-muted-foreground mt-2">
          {action.tolerance && <span>Tolerance: {action.tolerance.toLowerCase()}. </span>}
          {action.issueObserved && <span className="text-primary">Issue noted.</span>}
        </p>
      )}

      {action.notes && !editingNote && (
        <p className="text-sm text-muted-foreground mt-2">{action.notes}</p>
      )}

      {action.completedBy && (
        <p className="text-xs text-muted-foreground mt-2">By {caregiverName(action.completedBy)}</p>
      )}

      <div className="flex flex-wrap gap-2 mt-3">
        {action.status !== 'COMPLETED' && (
          <Button
            type="button"
            variant="outline"
            size="xs"
            disabled={busy}
            onClick={() => void update({ status: 'COMPLETED' })}
          >
            Mark done
          </Button>
        )}
        {action.status !== 'SKIPPED' && (
          <Button
            type="button"
            variant="outline"
            size="xs"
            disabled={busy}
            onClick={() => void update({ status: 'SKIPPED' })}
          >
            Skip
          </Button>
        )}
        <Button
          type="button"
          variant="outline"
          size="xs"
          onClick={() => setEditingNote(v => !v)}
        >
          {editingNote ? 'Cancel' : 'Note'}
        </Button>
      </div>

      {editingNote && (
        <div className="mt-2 flex gap-2">
          <Input
            value={note}
            onChange={e => setNote(e.target.value)}
            className="flex-1"
            placeholder="Add a note"
          />
          <Button
            type="button"
            size="xs"
            disabled={busy}
            onClick={() => void update({ notes: note }).then(() => setEditingNote(false))}
          >
            Save
          </Button>
        </div>
      )}
    </li>
  )
}
