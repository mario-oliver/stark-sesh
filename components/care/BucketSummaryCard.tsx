'use client'

import Link from 'next/link'
import { ChevronRight } from 'lucide-react'
import type { BucketPayload, CareBucket } from '@/lib/api/endpoints/dogs'
import { cn } from '@/lib/utils'

const BUCKET_META: Record<
  CareBucket,
  { label: string; description: string; href: (dogId: string) => string }
> = {
  ACTIVITY: {
    label: 'Activity',
    description: 'Therapeutic work & workload',
    href: dogId => `/dogs/${dogId}/today/activity`
  },
  MOBILITY: {
    label: 'Mobility',
    description: 'How the dog is moving',
    href: dogId => `/dogs/${dogId}/today/mobility`
  },
  RECOVERY: {
    label: 'Recovery',
    description: 'How the dog tolerated today',
    href: dogId => `/dogs/${dogId}/today/recovery`
  }
}

function bucketSummary(bucket: CareBucket, data: BucketPayload) {
  if (bucket === 'RECOVERY') {
    const score = data.score
    if (score) return `${score.score} · ${score.label}`
    if (data.observations.length > 0) return `${data.observations.length} observation(s) today`
    return 'Record how Stark is feeling'
  }
  if (bucket === 'MOBILITY') {
    const obs = data.observations[0]
    if (obs) return obs.note.slice(0, 60) + (obs.note.length > 60 ? '…' : '')
    if (data.progress && data.progress.total > 0) {
      return `${data.progress.completed} of ${data.progress.total} complete`
    }
    return 'No mobility notes yet'
  }
  if (data.progress && data.progress.total > 0) {
    return `${data.progress.completed} of ${data.progress.total} complete`
  }
  const names = data.tasks.slice(0, 3).map(t => t.nameSnapshot)
  return names.length > 0 ? names.join(', ') : 'Nothing logged yet'
}

export function BucketSummaryCard({
  bucket,
  data,
  dogId
}: {
  bucket: CareBucket
  data: BucketPayload
  dogId: string
}) {
  const meta = BUCKET_META[bucket]
  const summary = bucketSummary(bucket, data)

  return (
    <Link
      href={meta.href(dogId)}
      className={cn(
        'flex items-center justify-between gap-3 rounded-lg border border-border bg-card p-4',
        'hover:bg-accent/30 transition-colors'
      )}
    >
      <div className="min-w-0">
        <p className="font-medium text-foreground">{meta.label}</p>
        <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{summary}</p>
      </div>
      <ChevronRight className="size-5 shrink-0 text-muted-foreground" />
    </Link>
  )
}
