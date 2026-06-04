'use client'

import { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { ActionRow } from '@/components/care/ActionRow'
import { MovementRow } from '@/components/care/MovementRow'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter } from '@/components/ui/card'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { useApiClient } from '@/hooks/use-api-client'
import type { DailyCareActionRecord } from '@/lib/api/endpoints/dogs'
import {
  STATUS_COLORS,
  STATUS_LABELS,
  caregiverName,
  formatTimestamp
} from '@/lib/care/display'
import { cn } from '@/lib/utils'

export function ExerciseCard({
  action,
  dogId,
  onUpdated
}: {
  action: DailyCareActionRecord
  dogId: string
  onUpdated: () => void
}) {
  const { apiClient, isReady } = useApiClient()
  const [open, setOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  const hasMovements = (action.steps?.length ?? 0) > 0

  const updateExercise = async (status: 'COMPLETED' | 'SKIPPED') => {
    if (!isReady) return
    setBusy(true)
    try {
      await apiClient.updateDailyAction(dogId, action.id, { status })
      onUpdated()
    } finally {
      setBusy(false)
    }
  }

  return (
    <li>
      <Collapsible open={open} onOpenChange={setOpen}>
        <Card className="gap-0 py-0 overflow-hidden shadow-none">
          <CollapsibleTrigger asChild>
            <button
              type="button"
              className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left hover:bg-accent/30 transition-colors"
            >
              <span className="font-medium text-foreground">{action.nameSnapshot}</span>
              <ChevronDown
                className={cn(
                  'size-4 shrink-0 text-muted-foreground transition-transform duration-200',
                  open && 'rotate-180'
                )}
              />
            </button>
          </CollapsibleTrigger>

          <CollapsibleContent>
            <CardContent className="pt-0 pb-5 px-4 space-y-4">
              <div className="flex items-start justify-between gap-3">
                <p className="text-xs text-muted-foreground">
                  {action.categorySnapshot.replace(/_/g, ' ')}
                </p>
                <span
                  className={`text-xs px-2 py-1 rounded-full shrink-0 ${STATUS_COLORS[action.status]}`}
                >
                  {STATUS_LABELS[action.status]}
                </span>
              </div>

              {hasMovements && action.movementProgress && (
                <p className="text-xs text-primary">
                  {action.movementProgress.completed} of {action.movementProgress.total} movements
                </p>
              )}

              {hasMovements ? (
                <ul className="space-y-2 rounded-lg bg-secondary/20 p-2">
                  {action.steps.map((movement, index) => (
                    <MovementRow
                      key={movement.id}
                      movement={movement}
                      dogId={dogId}
                      onUpdated={onUpdated}
                      embedded
                      variant={index % 2 === 0 ? 'warm' : 'cool'}
                    />
                  ))}
                </ul>
              ) : (
                <ActionRow action={action} dogId={dogId} onUpdated={onUpdated} embedded hideHeader />
              )}

              {(action.completedBy || action.completedAt) && (
                <p className="text-xs text-muted-foreground">
                  {action.completedBy && <>By {caregiverName(action.completedBy)}</>}
                  {action.completedBy && action.completedAt && ' · '}
                  {action.completedAt && formatTimestamp(action.completedAt)}
                </p>
              )}
            </CardContent>

            {hasMovements && (
              <CardFooter className="border-t pt-4 pb-4 flex flex-wrap gap-2">
                {action.status !== 'COMPLETED' && (
                  <Button
                    type="button"
                    size="sm"
                    disabled={busy}
                    onClick={() => void updateExercise('COMPLETED')}
                    className="flex-1 min-w-[140px]"
                  >
                    Mark entire exercise done
                  </Button>
                )}
                {action.status !== 'SKIPPED' && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={busy}
                    onClick={() => void updateExercise('SKIPPED')}
                  >
                    Skip exercise
                  </Button>
                )}
              </CardFooter>
            )}
          </CollapsibleContent>
        </Card>
      </Collapsible>
    </li>
  )
}
