'use client'

import { useState } from 'react'
import { ExerciseMeasurement } from '@/components/care/ExerciseMeasurement'
import { SpriteCompletionFlash } from '@/components/sprite/SpriteCompletionFlash'
import { SpriteOverlay } from '@/components/sprite/SpriteOverlay'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { useApiClient } from '@/hooks/use-api-client'
import type { DailyCareActionRecord, DailyCareActionStatus } from '@/lib/api/endpoints/dogs'
import { getMeasurementMode } from '@/lib/care/measurement'
import { caregiverName, formatTimestamp } from '@/lib/care/display'
import { cn } from '@/lib/utils'

function sourceLabel(source: DailyCareActionRecord['source']) {
  switch (source) {
    case 'LLM_EXTRACTED':
      return 'From voice'
    case 'PLAN_VARIATION':
      return 'From voice · variation'
    case 'AD_HOC':
      return 'Added manually'
    default:
      return null
  }
}

export function TaskRow({
  task,
  dogId,
  onUpdated
}: {
  task: DailyCareActionRecord
  dogId: string
  onUpdated: () => void
}) {
  const { apiClient, isReady } = useApiClient()
  const [editingNote, setEditingNote] = useState(false)
  const [note, setNote] = useState(task.notes ?? '')
  const [busy, setBusy] = useState(false)
  const [savingNote, setSavingNote] = useState(false)
  const [showCompletion, setShowCompletion] = useState(false)

  const isCompleted = task.status === 'COMPLETED'
  const isSkipped = task.status === 'SKIPPED'
  const measurementMode = getMeasurementMode(task.targetReps, task.targetDurationSeconds)
  const usesMeasurement = measurementMode !== 'checklist' && !isCompleted
  const badge = sourceLabel(task.source)

  const update = async (body: {
    status?: DailyCareActionStatus
    notes?: string
    needsReview?: boolean
  }) => {
    if (!isReady) return
    const isNoteSave = body.notes !== undefined
    const isCompletion = body.status === 'COMPLETED'
    if (isNoteSave) setSavingNote(true)
    else setBusy(true)
    try {
      await apiClient.updateDailyAction(dogId, task.id, body)
      onUpdated()
      if (isCompletion) setShowCompletion(true)
    } finally {
      if (isNoteSave) setSavingNote(false)
      else setBusy(false)
    }
  }

  const toggleComplete = () => {
    if (isCompleted) {
      void update({ status: 'PENDING' })
    } else {
      void update({ status: 'COMPLETED', needsReview: false })
    }
  }

  const confirmReview = () => void update({ needsReview: false, status: task.status })

  return (
    <li
      className={cn(
        'border border-border rounded-lg p-4 bg-card',
        isCompleted && 'opacity-75',
        isSkipped && 'opacity-60'
      )}
    >
      <div className="flex items-start gap-3">
        <Checkbox
          checked={isCompleted}
          disabled={busy || isSkipped}
          onCheckedChange={() => toggleComplete()}
          className="mt-0.5"
          aria-label={`Mark ${task.nameSnapshot} complete`}
        />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p
              className={cn(
                'font-medium text-foreground',
                isCompleted && 'line-through text-muted-foreground'
              )}
            >
              {task.nameSnapshot}
            </p>
            {badge && (
              <Badge variant="secondary" className="text-[10px]">
                {badge}
              </Badge>
            )}
            {task.needsReview && (
              <Badge variant="outline" className="text-[10px] border-amber-500 text-amber-700">
                Review
              </Badge>
            )}
          </div>

          {task.substitutedFor && (
            <p className="text-xs text-muted-foreground mt-1">
              Substituted for {task.substitutedFor.nameSnapshot}
            </p>
          )}

          {task.descriptionSnapshot && (
            <p className="text-sm text-muted-foreground mt-1">{task.descriptionSnapshot}</p>
          )}
          {task.instructionsSnapshot && (
            <p className="text-xs text-muted-foreground mt-1">{task.instructionsSnapshot}</p>
          )}

          <SpriteCompletionFlash
            visible={showCompletion}
            seed={task.id}
            onDismiss={() => setShowCompletion(false)}
          />

          <ExerciseMeasurement
            targetReps={task.targetReps}
            targetDurationSeconds={task.targetDurationSeconds}
            completed={isCompleted}
            busy={busy}
            onMarkDone={() => void update({ status: 'COMPLETED' })}
          />

          {task.notes && !editingNote && (
            <p className="text-sm text-muted-foreground mt-2">{task.notes}</p>
          )}

          {(task.completedBy || task.completedAt) && (
            <p className="text-xs text-muted-foreground mt-2">
              {task.completedBy && <>By {caregiverName(task.completedBy)}</>}
              {task.completedBy && task.completedAt && ' · '}
              {task.completedAt && formatTimestamp(task.completedAt)}
            </p>
          )}

          <div className="flex flex-wrap gap-2 mt-3">
            {!isCompleted && !isSkipped && !usesMeasurement && null}
            {!isSkipped && task.status !== 'COMPLETED' && (
              <Button
                type="button"
                variant="ghost"
                size="xs"
                disabled={busy}
                onClick={() => void update({ status: 'SKIPPED' })}
              >
                Skip
              </Button>
            )}
            <Button
              type="button"
              variant="ghost"
              size="xs"
              onClick={() => setEditingNote(v => !v)}
            >
              {editingNote ? 'Cancel' : 'Note'}
            </Button>
            {task.needsReview && (
              <Button type="button" variant="outline" size="xs" disabled={busy} onClick={confirmReview}>
                Confirm
              </Button>
            )}
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
        </div>
      </div>
      {savingNote && <SpriteOverlay preset="savingNote" />}
    </li>
  )
}
