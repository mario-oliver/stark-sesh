'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import type {
  CareActionRecord,
  CreateCareActionInput,
  UpdateCareActionInput
} from '@/lib/api/endpoints/dogs'
import {
  CATEGORY_OPTIONS,
  FREQUENCY_OPTIONS,
  TIME_OF_DAY_OPTIONS
} from '@/lib/care/labels'

type FormState = {
  name: string
  description: string
  category: CreateCareActionInput['category']
  frequency: CreateCareActionInput['frequency']
  timeOfDay: CreateCareActionInput['timeOfDay']
  targetReps: string
  targetDurationSeconds: string
  instructions: string
}

function emptyForm(): FormState {
  return {
    name: '',
    description: '',
    category: 'GENERAL_CARE',
    frequency: 'DAILY',
    timeOfDay: 'ANYTIME',
    targetReps: '',
    targetDurationSeconds: '',
    instructions: ''
  }
}

function formFromAction(action: CareActionRecord): FormState {
  return {
    name: action.name,
    description: action.description ?? '',
    category: action.category,
    frequency: action.frequency,
    timeOfDay: action.timeOfDay ?? 'ANYTIME',
    targetReps: action.targetReps?.toString() ?? '',
    targetDurationSeconds: action.targetDurationSeconds?.toString() ?? '',
    instructions: action.instructions ?? ''
  }
}

function toPayload(form: FormState): CreateCareActionInput {
  return {
    name: form.name.trim(),
    description: form.description.trim() || null,
    category: form.category,
    frequency: form.frequency,
    timeOfDay: form.timeOfDay || null,
    targetReps: form.targetReps.trim() ? Number.parseInt(form.targetReps, 10) : null,
    targetDurationSeconds: form.targetDurationSeconds.trim()
      ? Number.parseInt(form.targetDurationSeconds, 10)
      : null,
    instructions: form.instructions.trim() || null
  }
}

export function CareActionForm({
  open,
  onOpenChange,
  action,
  onSubmit,
  busy
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  action?: CareActionRecord | null
  onSubmit: (input: CreateCareActionInput | UpdateCareActionInput) => Promise<void>
  busy?: boolean
}) {
  const [form, setForm] = useState<FormState>(action ? formFromAction(action) : emptyForm())
  const [error, setError] = useState<string | null>(null)

  const handleOpenChange = (next: boolean) => {
    if (next) {
      setForm(action ? formFromAction(action) : emptyForm())
      setError(null)
    }
    onOpenChange(next)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name.trim()) {
      setError('Name is required')
      return
    }
    setError(null)
    try {
      await onSubmit(toPayload(form))
      onOpenChange(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save exercise')
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="bg-zinc-950 border-zinc-800 text-zinc-100 max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{action ? 'Edit exercise' : 'Add exercise'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={e => void handleSubmit(e)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              className="bg-zinc-900 border-zinc-700"
              placeholder="Morning stretch routine"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Input
              id="description"
              value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              className="bg-zinc-900 border-zinc-700"
              placeholder="Optional short description"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Category</Label>
              <Select
                value={form.category}
                onValueChange={v =>
                  setForm(f => ({ ...f, category: v as FormState['category'] }))
                }
              >
                <SelectTrigger className="w-full bg-zinc-900 border-zinc-700">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-zinc-900 border-zinc-700">
                  {CATEGORY_OPTIONS.map(opt => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Frequency</Label>
              <Select
                value={form.frequency}
                onValueChange={v =>
                  setForm(f => ({ ...f, frequency: v as FormState['frequency'] }))
                }
              >
                <SelectTrigger className="w-full bg-zinc-900 border-zinc-700">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-zinc-900 border-zinc-700">
                  {FREQUENCY_OPTIONS.map(opt => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Time of day</Label>
            <Select
              value={form.timeOfDay ?? 'ANYTIME'}
              onValueChange={v =>
                setForm(f => ({ ...f, timeOfDay: v as FormState['timeOfDay'] }))
              }
            >
              <SelectTrigger className="w-full bg-zinc-900 border-zinc-700">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-zinc-900 border-zinc-700">
                {TIME_OF_DAY_OPTIONS.map(opt => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="targetReps">Target reps</Label>
              <Input
                id="targetReps"
                type="number"
                min={0}
                value={form.targetReps}
                onChange={e => setForm(f => ({ ...f, targetReps: e.target.value }))}
                className="bg-zinc-900 border-zinc-700"
                placeholder="Optional"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="targetDuration">Duration (sec)</Label>
              <Input
                id="targetDuration"
                type="number"
                min={0}
                value={form.targetDurationSeconds}
                onChange={e => setForm(f => ({ ...f, targetDurationSeconds: e.target.value }))}
                className="bg-zinc-900 border-zinc-700"
                placeholder="Optional"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="instructions">Instructions</Label>
            <Textarea
              id="instructions"
              value={form.instructions}
              onChange={e => setForm(f => ({ ...f, instructions: e.target.value }))}
              className="bg-zinc-900 border-zinc-700 min-h-20"
              placeholder="How to perform this exercise"
            />
          </div>

          {error && <p className="text-sm text-red-400">{error}</p>}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="border-zinc-700"
            >
              Cancel
            </Button>
            <Button type="submit" disabled={busy} className="bg-amber-600 hover:bg-amber-500 text-black">
              {busy ? 'Saving…' : action ? 'Save changes' : 'Add exercise'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
