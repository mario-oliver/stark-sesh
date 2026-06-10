'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { AlertCircle, CheckCircle2, ClipboardCheck, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
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
import type {
  AuditObservation,
  AuditReport,
  CareAgentSessionPayload,
  PlanAuditDraft,
  ProposedChange,
  ProposedChangeUpdates,
  ProposedProgramChanges
} from '@/lib/api/endpoints/dogs'
import {
  BUCKET_LABELS,
  FREQUENCY_LABELS,
  TIME_OF_DAY_LABELS
} from '@/lib/care/labels'
import { cn } from '@/lib/utils'

const VET_DISCLAIMER =
  'This is not veterinary advice. Consult your vet before making changes to your dog\'s care.'

const PROPOSE_CHANGES_PROMPT =
  'Based on this analysis, please propose specific changes to improve the program.'

function ratingLabel(rating: AuditReport['overallRating']) {
  switch (rating) {
    case 'GOOD':
      return 'Good'
    case 'FAIR':
      return 'Fair'
    default:
      return 'Needs work'
  }
}

function ratingClass(rating: AuditReport['overallRating']) {
  switch (rating) {
    case 'GOOD':
      return 'bg-green-500/15 text-green-700 dark:text-green-400'
    case 'FAIR':
      return 'bg-amber-500/15 text-amber-700 dark:text-amber-400'
    default:
      return 'bg-red-500/15 text-red-700 dark:text-red-400'
  }
}

function severityClass(severity: AuditObservation['severity']) {
  switch (severity) {
    case 'HIGH':
      return 'bg-red-500'
    case 'MEDIUM':
      return 'bg-amber-500'
    default:
      return 'bg-yellow-500'
  }
}

function changeTypeLabel(type: ProposedChange['type']) {
  switch (type) {
    case 'CREATE':
      return 'Add'
    case 'DEACTIVATE':
      return 'Remove'
    default:
      return 'Update'
  }
}

function changeTypeClass(type: ProposedChange['type']) {
  switch (type) {
    case 'CREATE':
      return 'bg-green-500/15 text-green-700 dark:text-green-400'
    case 'DEACTIVATE':
      return 'bg-red-500/15 text-red-700 dark:text-red-400'
    default:
      return 'bg-primary/15 text-primary'
  }
}

function changedFields(updates: ProposedChangeUpdates): string[] {
  const parts: string[] = []
  if (updates.frequency) parts.push(FREQUENCY_LABELS[updates.frequency])
  if (updates.timeOfDay) parts.push(TIME_OF_DAY_LABELS[updates.timeOfDay])
  if (updates.bucket) parts.push(BUCKET_LABELS[updates.bucket])
  return parts
}

function AuditReportCard({ report }: { report: AuditReport }) {
  return (
    <div className="rounded-lg border border-border bg-muted/30 p-4 space-y-3 text-sm">
      <div className="flex items-center gap-2">
        <span
          className={cn(
            'text-xs font-semibold px-2.5 py-1 rounded-full',
            ratingClass(report.overallRating)
          )}
        >
          {ratingLabel(report.overallRating)}
        </span>
        <p className="font-medium text-foreground">Program analysis</p>
      </div>

      <p className="text-foreground">{report.summary}</p>

      {report.strengths.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-green-700 dark:text-green-400 flex items-center gap-1.5 mb-1">
            <CheckCircle2 className="size-3.5" />
            Strengths
          </p>
          <ul className="space-y-1">
            {report.strengths.map((s, i) => (
              <li key={i} className="text-xs text-muted-foreground">
                • {s}
              </li>
            ))}
          </ul>
        </div>
      )}

      {report.gaps.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-amber-700 dark:text-amber-400 flex items-center gap-1.5 mb-1">
            <AlertCircle className="size-3.5" />
            Areas to improve
          </p>
          <ul className="space-y-1">
            {report.gaps.map((g, i) => (
              <li key={i} className="text-xs text-muted-foreground">
                • {g}
              </li>
            ))}
          </ul>
        </div>
      )}

      {report.observations.length > 0 && (
        <div>
          <p className="text-xs uppercase tracking-widest text-muted-foreground mb-2">
            Exercise notes
          </p>
          <div className="space-y-2">
            {report.observations.map(obs => (
              <div
                key={obs.actionId}
                className="rounded-lg bg-background/60 p-3 space-y-1"
              >
                <div className="flex items-center gap-2">
                  <span
                    className={cn('size-2 rounded-full shrink-0', severityClass(obs.severity))}
                  />
                  <p className="text-xs font-semibold text-foreground">{obs.actionName}</p>
                </div>
                <p className="text-xs text-muted-foreground">{obs.finding}</p>
                <p className="text-xs text-foreground">{obs.recommendation}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function ProposedChangeCard({
  change,
  selected,
  onToggle
}: {
  change: ProposedChange
  selected: boolean
  onToggle: () => void
}) {
  const exerciseName = change.actionName ?? change.newAction?.name ?? 'Exercise'
  const updateFields = change.updates ? changedFields(change.updates) : []

  return (
    <button
      type="button"
      onClick={onToggle}
      className={cn(
        'w-full text-left rounded-lg border p-3 transition-colors',
        selected
          ? 'border-primary/40 bg-primary/5'
          : 'border-border bg-muted/20 hover:bg-muted/30'
      )}
    >
      <div className="flex items-start gap-3">
        <Checkbox checked={selected} className="mt-0.5 pointer-events-none" />
        <div className="flex-1 min-w-0 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={cn(
                'text-xs font-semibold px-2 py-0.5 rounded-full',
                changeTypeClass(change.type)
              )}
            >
              {changeTypeLabel(change.type)}
            </span>
            <p className="text-sm font-medium text-foreground truncate">{exerciseName}</p>
          </div>
          <p className="text-xs text-muted-foreground">{change.reason}</p>
          {updateFields.length > 0 && (
            <p className="text-xs text-muted-foreground">{updateFields.join(' · ')}</p>
          )}
        </div>
      </div>
    </button>
  )
}

function ProposedChangesList({
  plan,
  selectedIds,
  onToggle
}: {
  plan: ProposedProgramChanges
  selectedIds: Set<string>
  onToggle: (id: string) => void
}) {
  return (
    <div className="space-y-3">
      <div>
        <p className="font-medium text-foreground">Proposed changes</p>
        <p className="text-sm text-muted-foreground mt-1">{plan.summary}</p>
        <p className="text-xs text-muted-foreground mt-2">
          Select the changes you want to apply:
        </p>
      </div>
      <div className="space-y-2">
        {plan.changes.map(change => (
          <ProposedChangeCard
            key={change.id}
            change={change}
            selected={selectedIds.has(change.id)}
            onToggle={() => onToggle(change.id)}
          />
        ))}
      </div>
    </div>
  )
}

export function ProgramAuditDialog({
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
  const [session, setSession] = useState<CareAgentSessionPayload<PlanAuditDraft> | null>(null)
  const [input, setInput] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedChangeIds, setSelectedChangeIds] = useState<Set<string>>(new Set())
  const scrollRef = useRef<HTMLDivElement>(null)
  const startedRef = useRef(false)

  const reset = useCallback(() => {
    setSession(null)
    setInput('')
    setError(null)
    setBusy(false)
    setSelectedChangeIds(new Set())
    startedRef.current = false
  }, [])

  useEffect(() => {
    if (!open) {
      reset()
    }
  }, [open, reset])

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [session?.messages, session?.draft?.plan?.changes.length])

  useEffect(() => {
    if (session?.draft?.plan?.changes) {
      setSelectedChangeIds(new Set(session.draft.plan.changes.map(c => c.id)))
    }
  }, [session?.draft?.plan])

  const startAudit = useCallback(async () => {
    if (!isReady || busy) return
    setBusy(true)
    setError(null)
    try {
      const res = await apiClient.createCareAgentSession<PlanAuditDraft>(dogId, 'PLAN_AUDIT')
      setSession(res.data)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to start audit')
    } finally {
      setBusy(false)
    }
  }, [apiClient, busy, dogId, isReady])

  useEffect(() => {
    if (open && isReady && !session && !startedRef.current) {
      startedRef.current = true
      void startAudit()
    }
  }, [open, isReady, session, startAudit])

  const handleSend = async (message?: string) => {
    const text = (message ?? input).trim()
    if (!text || !session || !isReady || busy) return

    setBusy(true)
    setError(null)
    if (!message) setInput('')

    try {
      const res = await apiClient.sendCareAgentMessage<PlanAuditDraft>(dogId, session.id, text)
      setSession(res.data)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong')
    } finally {
      setBusy(false)
    }
  }

  const handleConfirm = async () => {
    if (!session || busy || selectedChangeIds.size === 0) return
    setBusy(true)
    setError(null)
    try {
      await apiClient.confirmCareAgentSession(dogId, session.id, {
        selectedChangeIds: Array.from(selectedChangeIds)
      })
      onOpenChange(false)
      await onCommitted()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to apply changes')
    } finally {
      setBusy(false)
    }
  }

  const handleCancel = async () => {
    if (session && isReady && session.status !== 'COMMITTED') {
      try {
        await apiClient.cancelCareAgentSession(dogId, session.id)
      } catch {
        /* ignore */
      }
    }
    onOpenChange(false)
  }

  const toggleChange = (id: string) => {
    setSelectedChangeIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const isLoading = busy && !session
  // The former REPORT_READY / PLAN_READY statuses are now expressed by the draft's
  // contents: a report with no plan is the report stage; a plan present is the
  // proposed-changes stage (unified CareAgentSession — ADR-0002).
  const report = session?.draft?.report ?? null
  const plan = session?.draft?.plan ?? null
  const reportReady = !!report && !plan
  const planReady = !!plan
  const failed = session?.status === 'FAILED'

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ClipboardCheck className="size-5 text-primary" />
            Audit program
          </DialogTitle>
          <DialogDescription>{VET_DISCLAIMER}</DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center gap-3 py-12">
            <Loader2 className="size-6 animate-spin text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Analyzing your program…</p>
          </div>
        ) : (
          <>
            <div
              ref={scrollRef}
              className="flex-1 min-h-0 overflow-y-auto space-y-3 py-2 max-h-[50vh]"
            >
              {report && <AuditReportCard report={report} />}

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

              {planReady && plan && (
                <ProposedChangesList
                  plan={plan}
                  selectedIds={selectedChangeIds}
                  onToggle={toggleChange}
                />
              )}

              {busy && session && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="size-4 animate-spin" />
                  Thinking…
                </div>
              )}

              {error && <p className="text-sm text-destructive">{error}</p>}
            </div>

            {failed && (
              <Button type="button" className="w-full" disabled={busy} onClick={() => void startAudit()}>
                Try again
              </Button>
            )}

            {planReady && (
              <div className="space-y-2">
                <Textarea
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  placeholder="Ask for different changes or more detail…"
                  rows={2}
                  disabled={busy}
                />
                {input.trim() && (
                  <Button
                    type="button"
                    variant="secondary"
                    className="w-full"
                    disabled={busy}
                    onClick={() => void handleSend()}
                  >
                    Send revision
                  </Button>
                )}
                <Button
                  type="button"
                  className="w-full"
                  disabled={busy || selectedChangeIds.size === 0}
                  onClick={() => void handleConfirm()}
                >
                  {selectedChangeIds.size === 0
                    ? 'Select changes to apply'
                    : `Apply ${selectedChangeIds.size} change${selectedChangeIds.size === 1 ? '' : 's'}`}
                </Button>
              </div>
            )}

            {reportReady && (
              <div className="space-y-2">
                <Textarea
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  placeholder="Ask a question or say what to improve…"
                  rows={3}
                  disabled={busy}
                  onKeyDown={e => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault()
                      void handleSend()
                    }
                  }}
                />
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1"
                    disabled={busy}
                    onClick={() => void handleSend(PROPOSE_CHANGES_PROMPT)}
                  >
                    Propose changes
                  </Button>
                  <Button
                    type="button"
                    className="flex-1"
                    disabled={!input.trim() || busy || !isReady}
                    onClick={() => void handleSend()}
                  >
                    Send
                  </Button>
                </div>
              </div>
            )}

            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => void handleCancel()}>
                Cancel
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
