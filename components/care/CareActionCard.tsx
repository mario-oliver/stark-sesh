'use client'

import type { CareActionRecord } from '@/lib/api/endpoints/dogs'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { BUCKET_LABELS, CATEGORY_LABELS, formatScheduleLabel } from '@/lib/care/labels'

export function CareActionCard({
  action,
  onEdit,
  onDeactivate
}: {
  action: CareActionRecord
  onEdit: () => void
  onDeactivate: () => void
}) {
  return (
    <li className="border border-border rounded-lg p-4 bg-card">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="font-medium text-foreground">{action.name}</p>
          <div className="flex flex-wrap gap-2 mt-2">
            {action.bucket && (
              <Badge variant="default">{BUCKET_LABELS[action.bucket]}</Badge>
            )}
            <Badge variant="outline">
              {CATEGORY_LABELS[action.category]}
            </Badge>
            {(action.steps?.length ?? 0) > 0 && (
              <Badge variant="secondary">
                {action.steps.length} movement{action.steps.length === 1 ? '' : 's'}
              </Badge>
            )}
            <span className="text-xs text-muted-foreground self-center">
              {formatScheduleLabel(action.frequency, action.timeOfDay)}
            </span>
          </div>
          {action.description && (
            <p className="text-sm text-muted-foreground mt-2">{action.description}</p>
          )}
          {action.instructions && (
            <p className="text-xs text-muted-foreground mt-2 line-clamp-2">{action.instructions}</p>
          )}
          {(action.targetReps != null || action.targetDurationSeconds != null) && (
            <p className="text-xs text-muted-foreground mt-2">
              {action.targetReps != null && `${action.targetReps} reps`}
              {action.targetReps != null && action.targetDurationSeconds != null && ' · '}
              {action.targetDurationSeconds != null &&
                `${Math.round(action.targetDurationSeconds / 60)} min`}
            </p>
          )}
        </div>
      </div>
      <div className="flex gap-2 mt-3">
        <Button type="button" variant="outline" size="xs" onClick={onEdit}>
          Edit
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="xs"
          onClick={onDeactivate}
          className="text-muted-foreground hover:text-destructive"
        >
          Remove
        </Button>
      </div>
    </li>
  )
}
