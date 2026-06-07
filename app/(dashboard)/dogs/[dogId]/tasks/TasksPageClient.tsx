'use client'

import Link from 'next/link'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { TaskRow } from '@/components/care/TaskRow'
import { CareActionCard } from '@/components/care/CareActionCard'
import { CareActionForm } from '@/components/care/CareActionForm'
import { ExerciseAgentDialog } from '@/components/care/ExerciseAgentDialog'
import { SpriteOverlay } from '@/components/sprite/SpriteOverlay'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'
import { useApiClient } from '@/hooks/use-api-client'
import { useActiveDog } from '@/hooks/use-active-dog'
import type {
  CareActionRecord,
  CareBucket,
  CarePlanPayload,
  CreateCareActionInput,
  DailyTaskRecord,
  TodayPayload,
  UpdateCareActionInput
} from '@/lib/api/endpoints/dogs'
import { BUCKET_LABELS } from '@/lib/care/labels'
import {
  formatDisplayDate,
  localDateString,
  shiftDateString
} from '@/lib/care/display'
import { cn } from '@/lib/utils'

type Tab = 'routine' | 'schedule'

function actionBucket(action: CareActionRecord): CareBucket {
  return action.bucket ?? 'ACTIVITY'
}

export function TasksPageClient({ dogId }: { dogId: string }) {
  const { apiClient, isReady } = useApiClient()
  useActiveDog(dogId)
  const [tab, setTab] = useState<Tab>('routine')
  const [routineBucket, setRoutineBucket] = useState<CareBucket>('ACTIVITY')
  const [plan, setPlan] = useState<CarePlanPayload | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [formOpen, setFormOpen] = useState(false)
  const [agentOpen, setAgentOpen] = useState(false)
  const [editingAction, setEditingAction] = useState<CareActionRecord | null>(null)
  const [deactivatingAction, setDeactivatingAction] = useState<CareActionRecord | null>(null)
  const [busy, setBusy] = useState(false)

  const [scheduleDate, setScheduleDate] = useState(localDateString())
  const [scheduleLoading, setScheduleLoading] = useState(false)
  const [schedulePayload, setSchedulePayload] = useState<TodayPayload | null>(null)

  const loadPlan = useCallback(async () => {
    if (!isReady) return
    setLoading(true)
    try {
      const res = await apiClient.getCarePlan(dogId)
      setPlan(res.data)
      setError(null)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load routine')
    } finally {
      setLoading(false)
    }
  }, [apiClient, isReady, dogId])

  const loadSchedule = useCallback(async () => {
    if (!isReady) return
    setScheduleLoading(true)
    try {
      const res = await apiClient.getToday(dogId, scheduleDate)
      setSchedulePayload(res.data)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load schedule')
    } finally {
      setScheduleLoading(false)
    }
  }, [apiClient, isReady, dogId, scheduleDate])

  useEffect(() => {
    void loadPlan()
  }, [loadPlan])

  useEffect(() => {
    if (tab === 'schedule') {
      void loadSchedule()
    }
  }, [tab, loadSchedule])

  const handleSaveAction = async (input: CreateCareActionInput | UpdateCareActionInput) => {
    setBusy(true)
    try {
      if (editingAction) {
        await apiClient.updateCareAction(dogId, editingAction.id, input)
      } else {
        await apiClient.createCareAction(dogId, input as CreateCareActionInput)
      }
      setEditingAction(null)
      await loadPlan()
    } finally {
      setBusy(false)
    }
  }

  const handleDeactivate = async () => {
    if (!deactivatingAction) return
    setBusy(true)
    try {
      await apiClient.deactivateCareAction(dogId, deactivatingAction.id)
      setDeactivatingAction(null)
      await loadPlan()
    } finally {
      setBusy(false)
    }
  }

  const filteredActions = useMemo(
    () => plan?.actions.filter(a => actionBucket(a) === routineBucket) ?? [],
    [plan, routineBucket]
  )

  const scheduleTasks: DailyTaskRecord[] = useMemo(() => {
    if (!schedulePayload) return []
    return [
      ...schedulePayload.buckets.activity.tasks,
      ...schedulePayload.buckets.mobility.tasks,
      ...schedulePayload.buckets.recovery.tasks
    ]
  }, [schedulePayload])

  return (
    <div className="min-h-screen bg-background text-foreground pb-12">
      <div className="max-w-lg mx-auto px-4 pt-6">
        <Link href="/today" className="text-sm text-primary hover:text-primary/80 underline">
          ← Care
        </Link>

        <header className="mt-4 mb-6">
          <h1 className="text-2xl font-semibold">Exercises</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage your care routine and daily schedule</p>
        </header>

        <div className="flex gap-2 mb-6">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setTab('routine')}
            className={cn(
              'rounded-full',
              tab === 'routine' && 'border-primary bg-primary/10 text-primary hover:bg-primary/10 hover:text-primary'
            )}
          >
            Routine
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setTab('schedule')}
            className={cn(
              'rounded-full',
              tab === 'schedule' && 'border-primary bg-primary/10 text-primary hover:bg-primary/10 hover:text-primary'
            )}
          >
            Daily schedule
          </Button>
        </div>

        {error && <p className="text-sm text-destructive mb-4">{error}</p>}

        {tab === 'routine' && (
          <>
            <div className="flex gap-2 mb-4">
              {(['ACTIVITY', 'MOBILITY', 'RECOVERY'] as CareBucket[]).map(b => (
                <Button
                  key={b}
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setRoutineBucket(b)}
                  className={cn(
                    'rounded-full text-xs',
                    routineBucket === b &&
                      'border-primary bg-primary/10 text-primary hover:bg-primary/10 hover:text-primary'
                  )}
                >
                  {BUCKET_LABELS[b]}
                </Button>
              ))}
            </div>

            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-xs uppercase tracking-widest text-muted-foreground">Care plan</p>
                <p className="text-sm text-foreground mt-0.5">{plan?.name ?? '…'}</p>
              </div>
              <div className="flex gap-2">
                <Button type="button" size="sm" variant="outline" onClick={() => setAgentOpen(true)}>
                  Create with AI
                </Button>
                <Button
                  type="button"
                  size="sm"
                  onClick={() => {
                    setEditingAction(null)
                    setFormOpen(true)
                  }}
                >
                  Add exercise
                </Button>
              </div>
            </div>

            {loading ? (
              <SpriteOverlay preset="dailyPlanLoading" mode="inline" size="small" className="py-4" />
            ) : filteredActions.length > 0 ? (
              <ul className="space-y-3">
                {filteredActions.map(action => (
                  <CareActionCard
                    key={action.id}
                    action={action}
                    onEdit={() => {
                      setEditingAction(action)
                      setFormOpen(true)
                    }}
                    onDeactivate={() => setDeactivatingAction(action)}
                  />
                ))}
              </ul>
            ) : (
              <div className="border border-dashed border-border rounded-lg p-8 text-center">
                <SpriteOverlay preset="emptyState" mode="inline" size="small" className="mb-4" />
                <p className="text-muted-foreground">
                  No {BUCKET_LABELS[routineBucket].toLowerCase()} exercises in your routine yet.
                </p>
                <Button
                  type="button"
                  size="sm"
                  className="mt-4"
                  onClick={() => {
                    setEditingAction(null)
                    setFormOpen(true)
                  }}
                >
                  Add your first exercise
                </Button>
              </div>
            )}
          </>
        )}

        {tab === 'schedule' && (
          <>
            <div className="flex items-center justify-between mb-4">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => setScheduleDate(d => shiftDateString(d, -1))}
                aria-label="Previous day"
              >
                <ChevronLeft className="size-5" />
              </Button>
              <div className="text-center">
                <p className="text-sm font-medium">{formatDisplayDate(scheduleDate)}</p>
                {schedulePayload && (
                  <p className="text-xs text-primary mt-0.5">
                    {schedulePayload.progress.completed} of {schedulePayload.progress.total} done
                  </p>
                )}
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => setScheduleDate(d => shiftDateString(d, 1))}
                aria-label="Next day"
              >
                <ChevronRight className="size-5" />
              </Button>
            </div>

            {scheduleLoading ? (
              <SpriteOverlay preset="dailyPlanLoading" mode="inline" size="small" className="py-4" />
            ) : schedulePayload ? (
              scheduleTasks.length > 0 ? (
                <ul className="space-y-3">
                  {scheduleTasks.map(task => (
                    <TaskRow key={task.id} task={task} dogId={dogId} onUpdated={loadSchedule} />
                  ))}
                </ul>
              ) : (
                <SpriteOverlay preset="emptyState" mode="inline" size="small" />
              )
            ) : null}
          </>
        )}
      </div>

      <ExerciseAgentDialog
        open={agentOpen}
        onOpenChange={setAgentOpen}
        dogId={dogId}
        onCommitted={loadPlan}
      />

      <CareActionForm
        open={formOpen}
        onOpenChange={open => {
          setFormOpen(open)
          if (!open) setEditingAction(null)
        }}
        action={editingAction}
        onSubmit={handleSaveAction}
        busy={busy}
        dogId={dogId}
        onMovementsChanged={async () => {
          if (!isReady) return
          const res = await apiClient.getCarePlan(dogId)
          setPlan(res.data)
          if (editingAction) {
            const refreshed = res.data.actions.find(a => a.id === editingAction.id)
            if (refreshed) setEditingAction(refreshed)
          }
        }}
      />

      <Dialog open={!!deactivatingAction} onOpenChange={open => !open && setDeactivatingAction(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remove exercise?</DialogTitle>
            <DialogDescription>
              &ldquo;{deactivatingAction?.name}&rdquo; will be removed from future days. Past records
              are kept.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setDeactivatingAction(null)}>
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={busy}
              onClick={() => void handleDeactivate()}
            >
              Remove
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
