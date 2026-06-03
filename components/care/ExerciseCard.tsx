'use client'

import Link from 'next/link'
import type { DailyCareActionRecord } from '@/lib/api/endpoints/dogs'
import { ActionRow } from '@/components/care/ActionRow'
import { STATUS_COLORS, STATUS_LABELS } from '@/lib/care/display'

export function ExerciseCard({
  action,
  dogId,
  onUpdated
}: {
  action: DailyCareActionRecord
  dogId: string
  onUpdated: () => void
}) {
  const hasMovements = (action.steps?.length ?? 0) > 0

  if (!hasMovements) {
    return <ActionRow action={action} dogId={dogId} onUpdated={onUpdated} />
  }

  const progress = action.movementProgress
  const progressLabel = progress
    ? `${progress.completed} of ${progress.total} movements`
    : null

  return (
    <li>
      <Link
        href={`/dogs/${dogId}/today/exercises/${action.id}`}
        className="block border border-border rounded-lg p-4 bg-card bg-gradient-to-br from-card to-accent/20 hover:border-primary/40 hover:from-accent/10 transition-colors"
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="font-medium text-foreground">{action.nameSnapshot}</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {action.categorySnapshot.replace(/_/g, ' ')}
            </p>
            {progressLabel && (
              <p className="text-xs text-primary mt-2">{progressLabel}</p>
            )}
          </div>
          <span
            className={`text-xs px-2 py-1 rounded-full shrink-0 ${STATUS_COLORS[action.status]}`}
          >
            {STATUS_LABELS[action.status]}
          </span>
        </div>
        <p className="text-xs text-muted-foreground mt-3">Tap to view movements →</p>
      </Link>
    </li>
  )
}
