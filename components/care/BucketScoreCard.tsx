'use client'

import type { BucketScore } from '@/lib/api/endpoints/dogs'
import { cn } from '@/lib/utils'

export function BucketScoreCard({
  score,
  title,
  className,
  updating
}: {
  score: BucketScore | null
  title: string
  className?: string
  updating?: boolean
}) {
  if (!score && !updating) {
    return (
      <div className={cn('rounded-lg border border-border bg-card p-4', className)}>
        <p className="text-xs uppercase tracking-widest text-muted-foreground">{title}</p>
        <p className="text-sm text-muted-foreground mt-2">No score yet — record a voice update.</p>
      </div>
    )
  }

  return (
    <div className={cn('rounded-lg border border-border bg-card p-4', className)}>
      <div className="flex items-start justify-between gap-2">
        <p className="text-xs uppercase tracking-widest text-muted-foreground">{title}</p>
        {updating && <span className="text-xs text-primary animate-pulse">Updating…</span>}
      </div>
      {score && (
        <>
          <p className="text-2xl font-semibold text-foreground mt-2">
            {score.score}
            <span className="text-base font-normal text-muted-foreground ml-2">· {score.label}</span>
          </p>
          <p className="text-sm text-muted-foreground mt-2">{score.summary}</p>
          {score.reasons.length > 0 && (
            <ul className="mt-3 space-y-1">
              {score.reasons.map((reason, i) => (
                <li key={i} className="text-xs text-muted-foreground flex gap-2">
                  <span className="text-primary">·</span>
                  {reason}
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </div>
  )
}
