'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useApiClient } from '@/hooks/use-api-client'
import type { DailyCareActionStepRecord, DailyCareActionStatus } from '@/lib/api/endpoints/dogs'
import { STATUS_COLORS, STATUS_LABELS, caregiverName, formatTimestamp } from '@/lib/care/display'

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
        className="mt-3 w-full max-h-48 rounded-lg border border-border bg-muted"
      />
    )
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={mediaUrl}
      alt=""
      className="mt-3 w-full max-h-48 object-cover rounded-lg border border-border"
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
    <li className="border border-border rounded-lg p-4 bg-card">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="font-medium text-foreground">{movement.nameSnapshot}</p>
          {movement.description && (
            <p className="text-sm text-muted-foreground mt-2">{movement.description}</p>
          )}
          {movement.instructions && (
            <p className="text-xs text-muted-foreground mt-2">{movement.instructions}</p>
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
        <p className="text-sm text-muted-foreground mt-2">{movement.notes}</p>
      )}

      {(movement.completedBy || movement.completedAt) && (
        <p className="text-xs text-muted-foreground mt-2">
          {movement.completedBy && <>By {caregiverName(movement.completedBy)}</>}
          {movement.completedBy && movement.completedAt && ' · '}
          {movement.completedAt && formatTimestamp(movement.completedAt)}
        </p>
      )}

      <div className="flex flex-wrap gap-2 mt-3">
        {movement.status !== 'COMPLETED' && (
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
        {movement.status !== 'SKIPPED' && (
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
