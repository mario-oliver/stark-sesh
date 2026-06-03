'use client'

import Link from 'next/link'
import { useCallback, useEffect, useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { ActionRow } from '@/components/care/ActionRow'
import { CareActionCard } from '@/components/care/CareActionCard'
import { CareActionForm } from '@/components/care/CareActionForm'
import { DogSubNav } from '@/components/dog/DogSubNav'
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
import type {
  CareActionRecord,
  CarePlanPayload,
  CreateCareActionInput,
  TodayPayload,
  UpdateCareActionInput
} from '@/lib/api/endpoints/dogs'
import {
  formatDisplayDate,
  localDateString,
  shiftDateString
} from '@/lib/care/display'

type Tab = 'routine' | 'schedule'

export function TasksPageClient({ dogId }: { dogId: string }) {
  const { apiClient, isReady } = useApiClient()
  const [tab, setTab] = useState<Tab>('routine')
  const [plan, setPlan] = useState<CarePlanPayload | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [formOpen, setFormOpen] = useState(false)
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

  return (
    <div className="min-h-screen bg-[#0c0c0c] text-zinc-100 pb-12">
      <div className="max-w-lg mx-auto px-4 pt-6">
        <Link href="/today" className="text-sm text-amber-400 hover:text-amber-300 underline">
          ← Home
        </Link>

        <header className="mt-4 mb-2">
          <h1 className="text-2xl font-semibold">Tasks</h1>
          <p className="text-sm text-zinc-500 mt-1">Manage your care routine and daily schedule</p>
        </header>

        <DogSubNav dogId={dogId} />

        <div className="flex gap-2 mb-6">
          <button
            type="button"
            onClick={() => setTab('routine')}
            className={`text-sm px-3 py-1.5 rounded-full border ${
              tab === 'routine'
                ? 'border-amber-600 bg-amber-600/10 text-amber-400'
                : 'border-zinc-800 text-zinc-500 hover:text-zinc-300'
            }`}
          >
            Routine
          </button>
          <button
            type="button"
            onClick={() => setTab('schedule')}
            className={`text-sm px-3 py-1.5 rounded-full border ${
              tab === 'schedule'
                ? 'border-amber-600 bg-amber-600/10 text-amber-400'
                : 'border-zinc-800 text-zinc-500 hover:text-zinc-300'
            }`}
          >
            Daily schedule
          </button>
        </div>

        {error && <p className="text-sm text-red-400 mb-4">{error}</p>}

        {tab === 'routine' && (
          <>
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-xs uppercase tracking-widest text-zinc-500">Care plan</p>
                <p className="text-sm text-zinc-300 mt-0.5">{plan?.name ?? '…'}</p>
              </div>
              <Button
                type="button"
                size="sm"
                className="bg-amber-600 hover:bg-amber-500 text-black"
                onClick={() => {
                  setEditingAction(null)
                  setFormOpen(true)
                }}
              >
                Add exercise
              </Button>
            </div>

            {loading ? (
              <p className="text-zinc-500">Loading routine…</p>
            ) : plan && plan.actions.length > 0 ? (
              <ul className="space-y-3">
                {plan.actions.map(action => (
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
              <div className="border border-dashed border-zinc-800 rounded-lg p-8 text-center">
                <p className="text-zinc-500">No exercises in your routine yet.</p>
                <Button
                  type="button"
                  size="sm"
                  className="mt-4 bg-amber-600 hover:bg-amber-500 text-black"
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
              <button
                type="button"
                onClick={() => setScheduleDate(d => shiftDateString(d, -1))}
                className="p-2 text-zinc-500 hover:text-zinc-200"
                aria-label="Previous day"
              >
                <ChevronLeft className="size-5" />
              </button>
              <div className="text-center">
                <p className="text-sm font-medium">{formatDisplayDate(scheduleDate)}</p>
                {schedulePayload && (
                  <p className="text-xs text-amber-400/90 mt-0.5">
                    {schedulePayload.progress.completed} of {schedulePayload.progress.total} done
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={() => setScheduleDate(d => shiftDateString(d, 1))}
                className="p-2 text-zinc-500 hover:text-zinc-200"
                aria-label="Next day"
              >
                <ChevronRight className="size-5" />
              </button>
            </div>

            {scheduleLoading ? (
              <p className="text-zinc-500">Loading schedule…</p>
            ) : schedulePayload ? (
              schedulePayload.dailyLog.dailyCareActions.length > 0 ? (
                <ul className="space-y-3">
                  {schedulePayload.dailyLog.dailyCareActions.map(action => (
                    <ActionRow
                      key={action.id}
                      action={action}
                      dogId={dogId}
                      onUpdated={loadSchedule}
                    />
                  ))}
                </ul>
              ) : (
                <p className="text-zinc-500 text-sm">No tasks scheduled for this day.</p>
              )
            ) : null}
          </>
        )}
      </div>

      <CareActionForm
        open={formOpen}
        onOpenChange={open => {
          setFormOpen(open)
          if (!open) setEditingAction(null)
        }}
        action={editingAction}
        onSubmit={handleSaveAction}
        busy={busy}
      />

      <Dialog open={!!deactivatingAction} onOpenChange={open => !open && setDeactivatingAction(null)}>
        <DialogContent className="bg-zinc-950 border-zinc-800 text-zinc-100">
          <DialogHeader>
            <DialogTitle>Remove exercise?</DialogTitle>
            <DialogDescription className="text-zinc-400">
              &ldquo;{deactivatingAction?.name}&rdquo; will be removed from future days. Past records
              are kept.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setDeactivatingAction(null)}
              className="border-zinc-700"
            >
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
