'use client'

import type { HealthObservationRecord } from '@/lib/api/endpoints/dogs'
import { caregiverName, formatTimestamp } from '@/lib/care/display'

export function ObservationRow({ observation }: { observation: HealthObservationRecord }) {
  return (
    <li className="border border-border rounded-lg px-4 py-3 bg-accent/20 border-l-2 border-l-accent-foreground/40">
      <p className="text-sm font-medium text-foreground">
        Observation: {observation.type.replace(/_/g, ' ').toLowerCase()}
        {observation.severity && (
          <span className="text-muted-foreground font-normal"> · {observation.severity.toLowerCase()}</span>
        )}
      </p>
      <p className="text-sm text-muted-foreground mt-1">{observation.note}</p>
      {observation.bodyArea && (
        <p className="text-xs text-muted-foreground mt-1">{observation.bodyArea}</p>
      )}
      <p className="text-xs text-muted-foreground mt-1">
        {caregiverName(observation.user)} · {formatTimestamp(observation.observedAt ?? observation.createdAt)}
      </p>
    </li>
  )
}
