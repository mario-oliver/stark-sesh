'use client'

import { useState } from 'react'
import { ExerciseMeasurement } from '@/components/care/ExerciseMeasurement'
import { SpriteCompletionFlash } from '@/components/sprite/SpriteCompletionFlash'
import { SpriteOverlay } from '@/components/sprite/SpriteOverlay'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useApiClient } from '@/hooks/use-api-client'
import type {
  DailyCareActionRecord,
  DailyCareActionStatus,
  Tolerance
} from '@/lib/api/endpoints/dogs'
import { getMeasurementMode } from '@/lib/care/measurement'
import { caregiverName, formatTimestamp } from '@/lib/care/display'

export function ActionRow({
  action,
  dogId,
  onUpdated,
  embedded = false,
  hideHeader = false
}: {
  action: DailyCareActionRecord
  dogId: string
  onUpdated: () => void
  embedded?: boolean
  hideHeader?: boolean
}) {
  const { apiClient, isReady } = useApiClient()
  const [editingNote, setEditingNote] = useState(false)
  const [note, setNote] = useState(action.notes ?? '')
  const [busy, setBusy] = useState(false)
  const [savingNote, setSavingNote] = useState(false)
  const [showCompletion, setShowCompletion] = useState(false)

  const measurementMode = getMeasurementMode(action.targetReps, action.targetDurationSeconds)
  const isCompleted = action.status === 'COMPLETED'
  const usesMeasurement = measurementMode !== 'checklist' && !isCompleted

  const update = async (body: {
    status?: DailyCareActionStatus
    notes?: string
    tolerance?: Tolerance | null
  }) => {
    if (!isReady) return
    const isNoteSave = body.notes !== undefined
    const isCompletion = body.status === 'COMPLETED'
    if (isNoteSave) setSavingNote(true)
    else setBusy(true)
    try {
      await apiClient.updateDailyAction(dogId, action.id, body)
      onUpdated()
      if (isCompletion) setShowCompletion(true)
    } finally {
      if (isNoteSave) setSavingNote(false)
      else setBusy(false)
    }
  }

  const content = (
    <>
      {(action.tolerance || action.issueObserved) && (
        <p className="text-sm text-muted-foreground">
          {action.tolerance && <span>Tolerance: {action.tolerance.toLowerCase()}. </span>}
          {action.issueObserved && <span className="text-primary">Issue noted.</span>}
        </p>
      )}

      <SpriteCompletionFlash
        visible={showCompletion}
        seed={action.id}
        onDismiss={() => setShowCompletion(false)}
      />

      <ExerciseMeasurement
        targetReps={action.targetReps}
        targetDurationSeconds={action.targetDurationSeconds}
        completed={isCompleted}
        busy={busy}
        onMarkDone={() => void update({ status: 'COMPLETED' })}
      />

      {action.notes && !editingNote && (
        <p className="text-sm text-muted-foreground">{action.notes}</p>
      )}

      {!hideHeader && (action.completedBy || action.completedAt) && (
        <p className="text-xs text-muted-foreground">
          {action.completedBy && <>By {caregiverName(action.completedBy)}</>}
          {action.completedBy && action.completedAt && ' · '}
          {action.completedAt && formatTimestamp(action.completedAt)}
        </p>
      )}

      <div className="flex flex-wrap gap-2">
        {action.status !== 'COMPLETED' && !usesMeasurement && (
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
        <div className="flex gap-2">
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
    </>
  )

  if (embedded) {
    return (
      <div className="space-y-3">
        {content}
        {savingNote && <SpriteOverlay preset="savingNote" />}
      </div>
    )
  }

  return (
    <li className="border border-border rounded-lg p-4 bg-card space-y-3">
      {!hideHeader && (
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="font-medium text-foreground">{action.nameSnapshot}</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {action.categorySnapshot.replace(/_/g, ' ')}
            </p>
          </div>
        </div>
      )}
      {content}
      {savingNote && <SpriteOverlay preset="savingNote" />}
    </li>
  )
}
