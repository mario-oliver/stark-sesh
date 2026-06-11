'use client'

/**
 * DAILY_LOG draft-review + confirm (issue 0017) — builds the design Mario chose in
 * 0016 (Variant D) against the real serialized Contract: C's transcript + agent
 * framing, A's category sections, B's confidence container (kind label dropped),
 * C's inert plan nudge. AWAITING_INPUT is the contract's free-text `questions[]`
 * with a reply box (the prototype's fixed candidate cards aren't on the wire); EMPTY
 * shows a Stark Sprite (ADR-0003 §9); plan-change suggestions are inert (§8).
 *
 * Session lifecycle mirrors ProgramAuditDialog (create on open → render draft →
 * confirm with selectedChangeIds). The cross-repo path is exercised for real in 0020;
 * here the API is the frozen Contract.
 */

import { useCallback, useEffect, useRef, useState } from 'react'
import { AlertTriangle, Check, Dog, Loader2, Sparkles, X } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { StarkSprite } from '@/components/sprite/StarkSprite'
import { useApiClient } from '@/hooks/use-api-client'
import type {
  CareAgentSessionPayload,
  DailyLogAdHocActionDraft,
  DailyLogCompletionDraft,
  DailyLogDraft,
  DailyLogObservationDraft,
  Tolerance
} from '@/lib/api/endpoints/dogs'
import { BUCKET_LABELS } from '@/lib/care/labels'
import {
  confidenceTier,
  defaultSelectedChangeIds,
  isEmptyDraft,
  sanitizeSelectedChangeIds
} from '@/lib/care/dailyLogReview'

type DailyLogSession = CareAgentSessionPayload<DailyLogDraft>

function formatDuration(seconds: number | null): string | null {
  if (seconds == null) return null
  return `${Math.round(seconds / 60)} min`
}

function actualsLine(item: {
  bucket: DailyLogCompletionDraft['bucket']
  actualReps: number | null
  actualDurationSeconds: number | null
  tolerance?: Tolerance | null
}): string {
  const parts: string[] = [BUCKET_LABELS[item.bucket]]
  if (item.actualReps != null) parts.push(`${item.actualReps} reps`)
  const dur = formatDuration(item.actualDurationSeconds)
  if (dur) parts.push(dur)
  if (item.tolerance) parts.push(`tolerated ${item.tolerance.toLowerCase()}`)
  return parts.join(' · ')
}

function observationTitle(o: DailyLogObservationDraft): string {
  const t = o.type.replace(/_/g, ' ').toLowerCase()
  return o.severity ? `${t} · ${o.severity.toLowerCase()}` : t
}

function observationMeta(o: DailyLogObservationDraft): string {
  return [o.bodyArea, o.note].filter(Boolean).join(' · ')
}

function AgentBubble({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-2">
      <span className="mt-0.5 size-7 shrink-0 rounded-full bg-primary/10 text-primary flex items-center justify-center">
        <Dog className="size-4" />
      </span>
      <div className="rounded-2xl rounded-tl-sm bg-muted px-3.5 py-2.5 max-w-[88%]">{children}</div>
    </div>
  )
}

function ConfidenceMeter({ c }: { c: number }) {
  const tier = confidenceTier(c)
  const filled = tier === 'high' ? 3 : tier === 'medium' ? 2 : 1
  const color =
    tier === 'high' ? 'bg-emerald-500' : tier === 'medium' ? 'bg-amber-500' : 'bg-destructive'
  return (
    <span className="inline-flex items-center gap-1 shrink-0" title={`Confidence ${Math.round(c * 100)}%`}>
      {[0, 1, 2].map(i => (
        <span key={i} className={`h-1 w-3 rounded-full ${i < filled ? color : 'bg-border'}`} />
      ))}
      <span className="text-[10px] text-muted-foreground ml-0.5">{Math.round(c * 100)}%</span>
    </span>
  )
}

function ItemCard({
  title,
  meta,
  confidence,
  needsReview,
  selected,
  onToggle
}: {
  title: string
  meta: string
  confidence: number
  needsReview: boolean
  selected: boolean
  onToggle: () => void
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={[
        'w-full text-left rounded-xl border px-3 py-2.5 transition-colors',
        selected ? 'border-primary/25 bg-primary/10' : 'border-dashed border-border bg-transparent'
      ].join(' ')}
    >
      <div className="flex items-start gap-2.5">
        <span
          className={[
            'mt-0.5 size-5 shrink-0 rounded-full border flex items-center justify-center',
            selected ? 'bg-primary border-primary text-primary-foreground' : 'border-muted-foreground/40'
          ].join(' ')}
        >
          {selected ? <Check className="size-3" /> : <X className="size-2.5 text-muted-foreground" />}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <span
              className={`text-sm font-medium ${selected ? 'text-foreground' : 'text-muted-foreground line-through'}`}
            >
              {title}
            </span>
            <ConfidenceMeter c={confidence} />
          </div>
          <div className="flex items-center gap-2 mt-0.5">
            <p className="text-xs text-muted-foreground">{meta}</p>
            {needsReview && (
              <span className="inline-flex items-center gap-1 text-[11px] font-medium text-amber-600 dark:text-amber-500">
                <AlertTriangle className="size-3" /> check this
              </span>
            )}
          </div>
        </div>
      </div>
    </button>
  )
}

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{label}</p>
      {children}
    </div>
  )
}

export function DailyLogReviewDialog({
  open,
  onOpenChange,
  dogId,
  voiceNoteId,
  transcript,
  onCommitted
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  dogId: string
  voiceNoteId: string | null
  transcript?: string
  onCommitted: () => void | Promise<void>
}) {
  const { apiClient, isReady } = useApiClient()
  const [session, setSession] = useState<DailyLogSession | null>(null)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [reply, setReply] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const startedRef = useRef(false)

  const reset = useCallback(() => {
    setSession(null)
    setSelected(new Set())
    setReply('')
    setError(null)
    setBusy(false)
    startedRef.current = false
  }, [])

  useEffect(() => {
    if (!open) reset()
  }, [open, reset])

  // Seed pre-selection from the draft whenever it (re)arrives: confident items in,
  // needsReview opt-in (ADR-0003 §3).
  useEffect(() => {
    if (session?.draft) setSelected(new Set(defaultSelectedChangeIds(session.draft)))
  }, [session?.draft])

  const start = useCallback(async () => {
    if (!isReady || !voiceNoteId || busy) return
    setBusy(true)
    setError(null)
    try {
      const res = await apiClient.createCareAgentSession<DailyLogDraft>(dogId, 'DAILY_LOG', {
        voiceNoteId
      })
      setSession(res.data)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to read that note')
    } finally {
      setBusy(false)
    }
  }, [apiClient, busy, dogId, isReady, voiceNoteId])

  useEffect(() => {
    if (open && isReady && voiceNoteId && !session && !startedRef.current) {
      startedRef.current = true
      void start()
    }
  }, [open, isReady, voiceNoteId, session, start])

  const toggle = (id: string) =>
    setSelected(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })

  const handleReply = async () => {
    const text = reply.trim()
    if (!text || !session || !isReady || busy) return
    setBusy(true)
    setError(null)
    setReply('')
    try {
      const res = await apiClient.sendCareAgentMessage<DailyLogDraft>(dogId, session.id, text)
      setSession(res.data)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong')
    } finally {
      setBusy(false)
    }
  }

  const handleConfirm = async () => {
    if (!session?.draft || busy) return
    const ids = sanitizeSelectedChangeIds(selected, session.draft)
    if (ids.length === 0) return
    setBusy(true)
    setError(null)
    try {
      await apiClient.confirmCareAgentSession(dogId, session.id, { selectedChangeIds: ids })
      onOpenChange(false)
      await onCommitted()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save')
    } finally {
      setBusy(false)
    }
  }

  const handlePlanNudge = () => {
    // Inert (ADR-0003 §8): never commits, never auto-spawns a PLAN_AUDIT session. The
    // real handoff is a deferred follow-up — for now this only acknowledges.
    toast('Noted — bring it up at your next plan review.')
  }

  const draft = session?.draft ?? null
  const status = session?.status
  const lastAssistant = [...(session?.messages ?? [])].reverse().find(m => m.role === 'assistant')

  const renderBody = () => {
    if (busy && !session) {
      return (
        <div className="flex flex-col items-center justify-center gap-3 py-12">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Reading your note…</p>
        </div>
      )
    }

    if (status === 'FAILED') {
      return (
        <div className="px-2 py-8 text-center space-y-3">
          <p className="text-sm text-destructive">Couldn&apos;t read that note.</p>
          <Button type="button" size="sm" disabled={busy} onClick={() => void start()}>
            Try again
          </Button>
        </div>
      )
    }

    if (status === 'AWAITING_INPUT') {
      const questions = session?.questions ?? []
      return (
        <div className="px-1 py-3 space-y-3">
          {questions.map((q, i) => (
            <div key={i} className="rounded-lg border border-amber-500/50 bg-amber-500/10 px-3 py-2.5">
              <p className="text-xs font-medium text-amber-700 dark:text-amber-400 flex items-center gap-1.5">
                <AlertTriangle className="size-3.5" /> One quick thing
              </p>
              <p className="text-sm text-foreground mt-1.5">{q}</p>
            </div>
          ))}
          <Textarea
            value={reply}
            onChange={e => setReply(e.target.value)}
            placeholder="Type your answer…"
            rows={2}
            disabled={busy}
            className="bg-white dark:bg-zinc-900 shadow-sm"
            onKeyDown={e => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                void handleReply()
              }
            }}
          />
          <Button type="button" className="w-full" disabled={busy || !reply.trim()} onClick={() => void handleReply()}>
            {busy ? 'Sending…' : 'Send answer'}
          </Button>
        </div>
      )
    }

    if (draft && isEmptyDraft(draft)) {
      return (
        <div className="px-2 py-8 text-center space-y-3 flex flex-col items-center">
          <StarkSprite animation="idle" size="small" />
          <p className="text-sm text-muted-foreground">
            {lastAssistant?.content ?? "I didn't catch any care to log in that note."}
          </p>
        </div>
      )
    }

    if (!draft) return null

    return (
      <div className="px-1 py-2 space-y-3">
        {transcript && (
          <p className="text-[11px] text-muted-foreground text-center italic px-2">
            &ldquo;{transcript.length > 240 ? `${transcript.slice(0, 240)}…` : transcript}&rdquo;
          </p>
        )}

        <AgentBubble>
          <p className="text-sm text-foreground">
            {lastAssistant?.content ?? "Here's what I caught from that. Tap any to leave it out, then save."}
          </p>
        </AgentBubble>

        <div className="space-y-4 pt-1">
          {draft.completions.length > 0 && (
            <Section label="Completed from plan">
              {draft.completions.map((c: DailyLogCompletionDraft) => (
                <ItemCard
                  key={c.changeId}
                  title={c.nameSnapshot}
                  meta={actualsLine(c)}
                  confidence={c.extractionConfidence}
                  needsReview={c.needsReview}
                  selected={selected.has(c.changeId)}
                  onToggle={() => toggle(c.changeId)}
                />
              ))}
            </Section>
          )}

          {draft.adHocActions.length > 0 && (
            <Section label="Also did (not on plan)">
              {draft.adHocActions.map((h: DailyLogAdHocActionDraft) => (
                <ItemCard
                  key={h.changeId}
                  title={h.name}
                  meta={actualsLine(h)}
                  confidence={h.extractionConfidence}
                  needsReview={h.needsReview}
                  selected={selected.has(h.changeId)}
                  onToggle={() => toggle(h.changeId)}
                />
              ))}
            </Section>
          )}

          {draft.observations.length > 0 && (
            <Section label="Observations">
              {draft.observations.map((o: DailyLogObservationDraft) => (
                <ItemCard
                  key={o.changeId}
                  title={observationTitle(o)}
                  meta={observationMeta(o)}
                  confidence={o.extractionConfidence}
                  needsReview={o.needsReview}
                  selected={selected.has(o.changeId)}
                  onToggle={() => toggle(o.changeId)}
                />
              ))}
            </Section>
          )}
        </div>

        {draft.planChangeSuggestions.map((s, i) => (
          <AgentBubble key={i}>
            <p className="text-sm text-foreground flex items-start gap-1.5">
              <Sparkles className="size-4 mt-0.5 shrink-0 text-primary" />
              <span>
                {s.text}{' '}
                <button
                  type="button"
                  onClick={handlePlanNudge}
                  className="font-medium text-primary underline-offset-2 hover:underline"
                >
                  Open a plan review?
                </button>
              </span>
            </p>
          </AgentBubble>
        ))}

        {error && <p className="text-sm text-destructive">{error}</p>}
      </div>
    )
  }

  const showConfirmBar = !!draft && !isEmptyDraft(draft) && status !== 'AWAITING_INPUT'
  const selectedCount = draft ? sanitizeSelectedChangeIds(selected, draft).length : 0

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] flex flex-col p-0 gap-0">
        <DialogHeader className="px-5 pt-5 pb-2">
          <DialogTitle>Today&apos;s log</DialogTitle>
          <DialogDescription className="sr-only">
            Review what was heard from your voice note and choose what to save.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 min-h-0 overflow-y-auto px-4">{renderBody()}</div>

        {showConfirmBar && (
          <div className="border-t border-border px-4 py-3 flex items-center justify-between gap-3">
            <span className="text-xs text-muted-foreground">Saving {selectedCount}</span>
            <Button type="button" size="sm" disabled={busy || selectedCount === 0} onClick={() => void handleConfirm()}>
              {busy ? 'Saving…' : 'Save to today'}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
