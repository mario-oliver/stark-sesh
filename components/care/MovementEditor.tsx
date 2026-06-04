'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useApiClient } from '@/hooks/use-api-client'
import type { CareActionRecord, CareActionStepRecord } from '@/lib/api/endpoints/dogs'
import { uploadCareStepMediaToS3 } from '@/lib/upload-care-step-media'

type DraftMovement = {
  name: string
  description: string
  instructions: string
  targetReps: string
  targetDurationSeconds: string
}

function emptyDraft(): DraftMovement {
  return {
    name: '',
    description: '',
    instructions: '',
    targetReps: '',
    targetDurationSeconds: ''
  }
}

function parseOptionalInt(value: string): number | null {
  const trimmed = value.trim()
  if (!trimmed) return null
  const n = Number.parseInt(trimmed, 10)
  return Number.isFinite(n) ? n : null
}

function targetsFromDraft(draft: DraftMovement) {
  return {
    targetReps: parseOptionalInt(draft.targetReps),
    targetDurationSeconds: parseOptionalInt(draft.targetDurationSeconds)
  }
}

function MovementMediaPreview({ step }: { step: CareActionStepRecord }) {
  if (!step.mediaUrl) return null
  const isVideo = step.mediaContentType?.startsWith('video/')
  if (isVideo) {
    return (
      <video
        src={step.mediaUrl}
        controls
        className="mt-2 w-full max-h-32 rounded border border-border"
      />
    )
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={step.mediaUrl}
      alt=""
      className="mt-2 w-full max-h-32 object-cover rounded border border-border"
    />
  )
}

function MovementTargetFields({
  targetReps,
  targetDurationSeconds,
  onTargetRepsChange,
  onTargetDurationChange,
  idPrefix
}: {
  targetReps: string
  targetDurationSeconds: string
  onTargetRepsChange: (value: string) => void
  onTargetDurationChange: (value: string) => void
  idPrefix: string
}) {
  return (
    <div className="grid grid-cols-2 gap-2 mt-2">
      <div className="space-y-1">
        <Label htmlFor={`${idPrefix}-reps`} className="text-xs">
          Target reps
        </Label>
        <Input
          id={`${idPrefix}-reps`}
          type="number"
          min={0}
          value={targetReps}
          onChange={e => onTargetRepsChange(e.target.value)}
          placeholder="Optional"
        />
      </div>
      <div className="space-y-1">
        <Label htmlFor={`${idPrefix}-duration`} className="text-xs">
          Hold (sec)
        </Label>
        <Input
          id={`${idPrefix}-duration`}
          type="number"
          min={0}
          value={targetDurationSeconds}
          onChange={e => onTargetDurationChange(e.target.value)}
          placeholder="Optional"
        />
      </div>
    </div>
  )
}

function ExistingMovementRow({
  step,
  dogId,
  actionId,
  onChanged,
  busy,
  setBusy,
  setError
}: {
  step: CareActionStepRecord
  dogId: string
  actionId: string
  onChanged: () => void
  busy: boolean
  setBusy: (v: boolean) => void
  setError: (v: string | null) => void
}) {
  const { apiClient, isReady } = useApiClient()
  const [targetReps, setTargetReps] = useState(step.targetReps?.toString() ?? '')
  const [targetDurationSeconds, setTargetDurationSeconds] = useState(
    step.targetDurationSeconds?.toString() ?? ''
  )
  const [uploading, setUploading] = useState(false)

  const saveTargets = async () => {
    if (!isReady) return
    setBusy(true)
    setError(null)
    try {
      await apiClient.updateCareActionStep(dogId, actionId, step.id, {
        targetReps: parseOptionalInt(targetReps),
        targetDurationSeconds: parseOptionalInt(targetDurationSeconds)
      })
      onChanged()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not save movement')
    } finally {
      setBusy(false)
    }
  }

  const handleMediaUpload = async (file: File) => {
    if (!isReady) return
    setUploading(true)
    setError(null)
    try {
      const { mediaKey, mediaContentType } = await uploadCareStepMediaToS3(apiClient, file)
      await apiClient.updateCareActionStep(dogId, actionId, step.id, {
        mediaKey,
        mediaContentType
      })
      onChanged()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Upload failed')
    } finally {
      setUploading(false)
    }
  }

  const handleRemove = async () => {
    if (!isReady) return
    setBusy(true)
    try {
      await apiClient.deactivateCareActionStep(dogId, actionId, step.id)
      onChanged()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not remove movement')
    } finally {
      setBusy(false)
    }
  }

  const targetsDirty =
    targetReps !== (step.targetReps?.toString() ?? '') ||
    targetDurationSeconds !== (step.targetDurationSeconds?.toString() ?? '')

  return (
    <li className="border border-border rounded-lg p-3 bg-card text-sm">
      <p className="font-medium text-foreground">{step.name}</p>
      {step.description && (
        <p className="text-muted-foreground mt-1 text-xs">{step.description}</p>
      )}
      <MovementMediaPreview step={step} />
      <MovementTargetFields
        idPrefix={`movement-${step.id}`}
        targetReps={targetReps}
        targetDurationSeconds={targetDurationSeconds}
        onTargetRepsChange={setTargetReps}
        onTargetDurationChange={setTargetDurationSeconds}
      />
      <div className="flex flex-wrap gap-2 mt-2">
        {targetsDirty && (
          <Button type="button" size="xs" disabled={busy} onClick={() => void saveTargets()}>
            Save targets
          </Button>
        )}
        <Button
          type="button"
          variant="outline"
          size="xs"
          disabled={uploading}
          onClick={() => document.getElementById(`movement-media-${step.id}`)?.click()}
        >
          {uploading ? 'Uploading…' : 'Photo / video'}
        </Button>
        <input
          id={`movement-media-${step.id}`}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif,video/mp4,video/webm,video/quicktime"
          className="sr-only"
          disabled={uploading}
          onChange={e => {
            const file = e.target.files?.[0]
            if (file) void handleMediaUpload(file)
            e.target.value = ''
          }}
        />
        <Button
          type="button"
          variant="ghost"
          size="xs"
          disabled={busy}
          onClick={() => void handleRemove()}
          className="text-muted-foreground hover:text-destructive"
        >
          Remove
        </Button>
      </div>
    </li>
  )
}

export function MovementEditor({
  dogId,
  action,
  onChanged
}: {
  dogId: string
  action: CareActionRecord
  onChanged: () => void
}) {
  const { apiClient, isReady } = useApiClient()
  const [draft, setDraft] = useState<DraftMovement>(emptyDraft())
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const steps = action.steps ?? []

  const handleAdd = async () => {
    if (!isReady || !draft.name.trim()) return
    setBusy(true)
    setError(null)
    try {
      await apiClient.createCareActionStep(dogId, action.id, {
        name: draft.name.trim(),
        description: draft.description.trim() || null,
        instructions: draft.instructions.trim() || null,
        ...targetsFromDraft(draft)
      })
      setDraft(emptyDraft())
      onChanged()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not add movement')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="border-t border-border pt-4 mt-4 space-y-4">
      <div>
        <h3 className="text-sm font-medium text-foreground">Movements</h3>
        <p className="text-xs text-muted-foreground mt-1">
          Optional steps inside this exercise (e.g. individual stretches). Set hold time or reps
          per movement.
        </p>
      </div>

      {steps.length > 0 && (
        <ul className="space-y-3">
          {steps.map(step => (
            <ExistingMovementRow
              key={step.id}
              step={step}
              dogId={dogId}
              actionId={action.id}
              onChanged={onChanged}
              busy={busy}
              setBusy={setBusy}
              setError={setError}
            />
          ))}
        </ul>
      )}

      <div className="space-y-2 border border-border rounded-lg p-3">
        <Label htmlFor={`movement-name-${action.id}`}>New movement</Label>
        <Input
          id={`movement-name-${action.id}`}
          value={draft.name}
          onChange={e => setDraft(d => ({ ...d, name: e.target.value }))}
          placeholder="Front leg stretch"
        />
        <Input
          value={draft.description}
          onChange={e => setDraft(d => ({ ...d, description: e.target.value }))}
          placeholder="Description (optional)"
        />
        <Textarea
          value={draft.instructions}
          onChange={e => setDraft(d => ({ ...d, instructions: e.target.value }))}
          className="min-h-16"
          placeholder="Instructions (optional)"
        />
        <MovementTargetFields
          idPrefix={`new-movement-${action.id}`}
          targetReps={draft.targetReps}
          targetDurationSeconds={draft.targetDurationSeconds}
          onTargetRepsChange={v => setDraft(d => ({ ...d, targetReps: v }))}
          onTargetDurationChange={v => setDraft(d => ({ ...d, targetDurationSeconds: v }))}
        />
        <Button
          type="button"
          size="sm"
          disabled={busy || !draft.name.trim()}
          onClick={() => void handleAdd()}
        >
          Add movement
        </Button>
      </div>

      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  )
}
