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
}

function emptyDraft(): DraftMovement {
  return { name: '', description: '', instructions: '' }
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
  const [uploadingStepId, setUploadingStepId] = useState<string | null>(null)

  const steps = action.steps ?? []

  const handleAdd = async () => {
    if (!isReady || !draft.name.trim()) return
    setBusy(true)
    setError(null)
    try {
      await apiClient.createCareActionStep(dogId, action.id, {
        name: draft.name.trim(),
        description: draft.description.trim() || null,
        instructions: draft.instructions.trim() || null
      })
      setDraft(emptyDraft())
      onChanged()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not add movement')
    } finally {
      setBusy(false)
    }
  }

  const handleRemove = async (stepId: string) => {
    if (!isReady) return
    setBusy(true)
    try {
      await apiClient.deactivateCareActionStep(dogId, action.id, stepId)
      onChanged()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not remove movement')
    } finally {
      setBusy(false)
    }
  }

  const handleMediaUpload = async (stepId: string, file: File) => {
    if (!isReady) return
    setUploadingStepId(stepId)
    setError(null)
    try {
      const { mediaKey, mediaContentType } = await uploadCareStepMediaToS3(apiClient, file)
      await apiClient.updateCareActionStep(dogId, action.id, stepId, {
        mediaKey,
        mediaContentType
      })
      onChanged()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Upload failed')
    } finally {
      setUploadingStepId(null)
    }
  }

  return (
    <div className="border-t border-border pt-4 mt-4 space-y-4">
      <div>
        <h3 className="text-sm font-medium text-foreground">Movements</h3>
        <p className="text-xs text-muted-foreground mt-1">
          Optional steps inside this exercise (e.g. individual stretches).
        </p>
      </div>

      {steps.length > 0 && (
        <ul className="space-y-3">
          {steps.map(step => (
            <li
              key={step.id}
              className="border border-border rounded-lg p-3 bg-card text-sm"
            >
              <p className="font-medium text-foreground">{step.name}</p>
              {step.description && (
                <p className="text-muted-foreground mt-1 text-xs">{step.description}</p>
              )}
              <MovementMediaPreview step={step} />
              <div className="flex flex-wrap gap-2 mt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="xs"
                  disabled={uploadingStepId === step.id}
                  onClick={() => document.getElementById(`movement-media-${step.id}`)?.click()}
                >
                  {uploadingStepId === step.id ? 'Uploading…' : 'Photo / video'}
                </Button>
                <input
                  id={`movement-media-${step.id}`}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif,video/mp4,video/webm,video/quicktime"
                  className="sr-only"
                  disabled={uploadingStepId === step.id}
                  onChange={e => {
                    const file = e.target.files?.[0]
                    if (file) void handleMediaUpload(step.id, file)
                    e.target.value = ''
                  }}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="xs"
                  disabled={busy}
                  onClick={() => void handleRemove(step.id)}
                  className="text-muted-foreground hover:text-destructive"
                >
                  Remove
                </Button>
              </div>
            </li>
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
