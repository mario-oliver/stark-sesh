'use client'

import { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { ActionRow } from '@/components/care/ActionRow'
import { Card, CardContent } from '@/components/ui/card'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import type { DailyCareActionRecord } from '@/lib/api/endpoints/dogs'
import {
  STATUS_COLORS,
  STATUS_LABELS,
  caregiverName,
  formatTimestamp
} from '@/lib/care/display'
import { BUCKET_LABELS } from '@/lib/care/labels'
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
  const [open, setOpen] = useState(false)

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
                <p className="text-xs text-muted-foreground">{BUCKET_LABELS[action.bucket]}</p>
                <span
                  className={`text-xs px-2 py-1 rounded-full shrink-0 ${STATUS_COLORS[action.status]}`}
                >
                  {STATUS_LABELS[action.status]}
                </span>
              </div>

              <ActionRow action={action} dogId={dogId} onUpdated={onUpdated} embedded hideHeader />

              {(action.completedBy || action.completedAt) && (
                <p className="text-xs text-muted-foreground">
                  {action.completedBy && <>By {caregiverName(action.completedBy)}</>}
                  {action.completedBy && action.completedAt && ' · '}
                  {action.completedAt && formatTimestamp(action.completedAt)}
                </p>
              )}
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>
    </li>
  )
}
