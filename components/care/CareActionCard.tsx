'use client'

import type { CareActionRecord } from '@/lib/api/endpoints/dogs'
import { Badge } from '@/components/ui/badge'
import { CATEGORY_LABELS, formatScheduleLabel } from '@/lib/care/labels'

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
    <li className="border border-zinc-800 rounded-lg p-4 bg-zinc-900/40">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="font-medium text-zinc-100">{action.name}</p>
          <div className="flex flex-wrap gap-2 mt-2">
            <Badge variant="outline" className="border-zinc-700 text-zinc-400">
              {CATEGORY_LABELS[action.category]}
            </Badge>
            <span className="text-xs text-zinc-500 self-center">
              {formatScheduleLabel(action.frequency, action.timeOfDay)}
            </span>
          </div>
          {action.description && (
            <p className="text-sm text-zinc-400 mt-2">{action.description}</p>
          )}
          {action.instructions && (
            <p className="text-xs text-zinc-500 mt-2 line-clamp-2">{action.instructions}</p>
          )}
          {(action.targetReps != null || action.targetDurationSeconds != null) && (
            <p className="text-xs text-zinc-600 mt-2">
              {action.targetReps != null && `${action.targetReps} reps`}
              {action.targetReps != null && action.targetDurationSeconds != null && ' · '}
              {action.targetDurationSeconds != null &&
                `${Math.round(action.targetDurationSeconds / 60)} min`}
            </p>
          )}
        </div>
      </div>
      <div className="flex gap-2 mt-3">
        <button
          type="button"
          onClick={onEdit}
          className="text-xs px-2 py-1 rounded border border-zinc-700 text-zinc-400 hover:text-zinc-200"
        >
          Edit
        </button>
        <button
          type="button"
          onClick={onDeactivate}
          className="text-xs px-2 py-1 rounded border border-zinc-800 text-zinc-600 hover:text-red-400"
        >
          Remove
        </button>
      </div>
    </li>
  )
}
