'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { Loader2, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { useApiClient } from '@/hooks/use-api-client'
import type { ExerciseAgentSessionPayload, ProposedExercise } from '@/lib/api/endpoints/dogs'
import {
  CATEGORY_LABELS,
  FREQUENCY_LABELS,
  TIME_OF_DAY_LABELS
} from '@/lib/care/labels'
import { cn } from '@/lib/utils'

const VET_DISCLAIMER =
  'This is not veterinary advice. Consult your vet before starting new rehab exercises.'

function DraftPreview({ draft }: { draft: ProposedExercise }) {
  return (
    <div className="rounded-lg border border-border bg-muted/30 p-4 space-y-3 text-sm">
      <div>
        <p className="font-medium text-foreground">{draft.name}</p>
        {draft.description && (
          <p className="text-muted-foreground mt-1">{draft.description}</p>
        )}
        <p className="text-xs text-muted-foreground mt-2">
          {CATEGORY_LABELS[draft.category]} · {FREQUENCY_LABELS[draft.frequency]}
          {draft.timeOfDay ? ` · ${TIME_OF_DAY_LABELS[draft.timeOfDay]}` : ''}
        </p>
      </div>
      {draft.instructions && (
        <p className="text-muted-foreground">
          <span className="font-medium text-foreground">Instructions: </span>
          {draft.instructions}
        </p>
      )}
      <div>
        <p className="text-xs uppercase tracking-widest text-muted-foreground mb-2">
          Movements ({draft.movements.length})
        </p>
        <ol className="list-decimal list-inside space-y-2">
          {draft.movements.map((m, i) => (
            <li key={i} className="text-foreground">
              <span className="font-medium">{m.name}</span>
              {m.instructions && (
                <p className="text-muted-foreground text-xs mt-0.5 ml-5">{m.instructions}</p>
              )}
            </li>
          ))}
        </ol>
      </div>
      <p className="text-xs text-muted-foreground">
        <span className="font-medium text-foreground">Why: </span>
        {draft.rationale}
      </p>
      <p className="text-xs text-amber-700 dark:text-amber-400">{draft.safetyNotes}</p>
      <p className="text-xs text-muted-foreground">
        <span className="font-medium text-foreground">Research: </span>
        {draft.researchSummary}
      </p>
    </div>
  )
}

export function ExerciseAgentDialog({
  open,
  onOpenChange,
  dogId,
  onCommitted
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  dogId: string
  onCommitted: () => void | Promise<void>
}) {
  const { apiClient, isReady } = useApiClient()
  const [session, setSession] = useState<ExerciseAgentSessionPayload | null>(null)
  const [input, setInput] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)

  const reset = useCallback(() => {
    setSession(null)
    setInput('')
    setError(null)
    setBusy(false)
  }, [])

  useEffect(() => {
    if (!open) {
      reset()
    }
  }, [open, reset])

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [session?.messages])

  const handleStartOrSend = async () => {
    const text = input.trim()
    if (!text || !isReady || busy) return

    setBusy(true)
    setError(null)
    setInput('')

    try {
      if (!session) {
        const res = await apiClient.createExerciseAgentSession(dogId, text)
        setSession(res.data)
      } else {
        const res = await apiClient.sendExerciseAgentMessage(dogId, session.id, text)
        setSession(res.data)
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong')
    } finally {
      setBusy(false)
    }
  }

  const handleConfirm = async () => {
    if (!session || busy) return
    setBusy(true)
    setError(null)
    try {
      await apiClient.confirmExerciseAgentSession(dogId, session.id)
      onOpenChange(false)
      await onCommitted()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to add exercise')
    } finally {
      setBusy(false)
    }
  }

  const handleCancel = async () => {
    if (session && isReady) {
      try {
        await apiClient.cancelExerciseAgentSession(dogId, session.id)
      } catch {
        /* ignore */
      }
    }
    onOpenChange(false)
  }

  const awaitingInput = session?.status === 'AWAITING_INPUT'
  const draftReady = session?.status === 'DRAFT_READY' && session.draft

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="size-5 text-primary" />
            Create exercise with AI
          </DialogTitle>
          <DialogDescription>{VET_DISCLAIMER}</DialogDescription>
        </DialogHeader>

        <div
          ref={scrollRef}
          className="flex-1 min-h-0 overflow-y-auto space-y-3 py-2 max-h-[50vh]"
        >
          {!session && (
            <p className="text-sm text-muted-foreground">
              Describe what you want to work on — for example, hip weakness after surgery, or
              gentle morning stretches.
            </p>
          )}

          {session?.messages.map((m, i) => (
            <div
              key={i}
              className={cn(
                'rounded-lg px-3 py-2 text-sm max-w-[95%]',
                m.role === 'user'
                  ? 'ml-auto bg-primary text-primary-foreground'
                  : 'bg-muted text-foreground'
              )}
            >
              <p className="whitespace-pre-wrap">{m.content}</p>
            </div>
          ))}

          {awaitingInput && session.questions.length > 0 && (
            <div className="rounded-lg border border-border p-3 text-sm">
              <p className="text-xs uppercase tracking-widest text-muted-foreground mb-2">
                Please answer
              </p>
              <ul className="list-disc list-inside space-y-1 text-foreground">
                {session.questions.map((q, i) => (
                  <li key={i}>{q}</li>
                ))}
              </ul>
            </div>
          )}

          {draftReady && <DraftPreview draft={session.draft!} />}

          {busy && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin" />
              Researching and drafting…
            </div>
          )}

          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>

        {!draftReady && (
          <div className="space-y-2">
            <Textarea
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder={
                session
                  ? 'Type your answer or more details…'
                  : 'e.g. My dog needs hip strengthening exercises, 5 min daily…'
              }
              rows={3}
              disabled={busy}
              onKeyDown={e => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  void handleStartOrSend()
                }
              }}
            />
            <Button
              type="button"
              className="w-full"
              disabled={!input.trim() || busy || !isReady}
              onClick={() => void handleStartOrSend()}
            >
              {session ? 'Send' : 'Start'}
            </Button>
          </div>
        )}

        <DialogFooter className="flex-col sm:flex-col gap-2">
          {draftReady && (
            <Button type="button" disabled={busy} onClick={() => void handleConfirm()}>
              Add to routine
            </Button>
          )}
          <Button type="button" variant="ghost" onClick={() => void handleCancel()}>
            Cancel
          </Button>
        </DialogFooter>

        {draftReady && (
          <Textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="Ask for changes, e.g. fewer movements or evening instead of morning…"
            rows={2}
            disabled={busy}
            className="mt-2"
          />
        )}
        {draftReady && input.trim() && (
          <Button
            type="button"
            variant="secondary"
            disabled={busy}
            onClick={() => void handleStartOrSend()}
          >
            Send revision
          </Button>
        )}
      </DialogContent>
    </Dialog>
  )
}
