'use client'

/**
 * Variant A — "Checklist Review"
 * THROWAWAY prototype (issue 0016). Dense, familiar, scannable: every extracted
 * item is a checkbox row grouped by output kind, confirm bar pinned at the
 * bottom with a live "Save N of M" count. Closest to the existing care UI.
 */

import { useState } from 'react'
import { AlertTriangle, ArrowRight, Check } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  EMPTY_AGENT_MESSAGE,
  MOCK_DRAFT,
  MOCK_QUESTION,
  type Scenario
} from './fixtures'
import {
  BUCKET_LABEL,
  actualsLine,
  defaultSelected,
  observationTitle,
  totalSelectable
} from './shared'

function Row({
  id,
  title,
  bucket,
  meta,
  needsReview,
  selected,
  onToggle
}: {
  id: string
  title: string
  bucket: string
  meta?: string | null
  needsReview: boolean
  selected: boolean
  onToggle: (id: string) => void
}) {
  return (
    <label
      htmlFor={`a-${id}`}
      className="flex items-start gap-3 px-3 py-2.5 rounded-md hover:bg-accent/40 cursor-pointer"
    >
      <Checkbox
        id={`a-${id}`}
        checked={selected}
        onCheckedChange={() => onToggle(id)}
        className="mt-0.5"
      />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-medium text-foreground">{title}</span>
          {needsReview && (
            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-amber-600 dark:text-amber-500">
              <AlertTriangle className="size-3" /> check this
            </span>
          )}
        </div>
        <p className="text-xs text-muted-foreground mt-0.5">
          {bucket}
          {meta ? ` · ${meta}` : ''}
        </p>
      </div>
    </label>
  )
}

function Group({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="px-3 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground mb-1">
        {label}
      </p>
      <div className="divide-y divide-border/60">{children}</div>
    </div>
  )
}

export function VariantA({ scenario }: { scenario: Scenario }) {
  const [selected, setSelected] = useState<Set<string>>(() => defaultSelected(MOCK_DRAFT))
  const [nudgeOpen, setNudgeOpen] = useState(true)

  const toggle = (id: string) =>
    setSelected(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })

  if (scenario === 'EMPTY') {
    return (
      <div className="px-4 py-10 text-center space-y-3">
        <div className="mx-auto size-10 rounded-full bg-muted flex items-center justify-center">
          <Check className="size-5 text-muted-foreground" />
        </div>
        <p className="text-sm text-muted-foreground">{EMPTY_AGENT_MESSAGE}</p>
        <Button variant="outline" size="sm">
          Record again
        </Button>
      </div>
    )
  }

  if (scenario === 'AWAITING_INPUT') {
    return (
      <div className="px-4 py-5 space-y-4">
        <div className="flex items-center gap-2 text-amber-600 dark:text-amber-500">
          <AlertTriangle className="size-4" />
          <p className="text-sm font-medium">One quick thing</p>
        </div>
        <p className="text-sm text-foreground">{MOCK_QUESTION.question}</p>
        <div className="space-y-2">
          {MOCK_QUESTION.options.map(opt => (
            <button
              key={opt.id}
              className="w-full flex items-center justify-between gap-2 rounded-md border border-border px-3 py-2.5 text-left hover:bg-accent/40"
            >
              <span className="text-sm font-medium">{opt.label}</span>
              {opt.hint && <span className="text-xs text-muted-foreground">{opt.hint}</span>}
            </button>
          ))}
        </div>
      </div>
    )
  }

  const total = totalSelectable(MOCK_DRAFT)
  const count = selected.size

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 pt-4 pb-2">
        <p className="text-sm text-muted-foreground">
          Here&apos;s what I heard. Uncheck anything wrong, then save.
        </p>
      </div>

      <div className="flex-1 overflow-y-auto px-1 py-2 space-y-4">
        <Group label="Completed from plan">
          {MOCK_DRAFT.completions.map(c => (
            <Row
              key={c.changeId}
              id={c.changeId}
              title={c.nameSnapshot}
              bucket={BUCKET_LABEL[c.bucket]}
              meta={actualsLine(c)}
              needsReview={c.needsReview}
              selected={selected.has(c.changeId)}
              onToggle={toggle}
            />
          ))}
        </Group>

        <Group label="Also did (not on plan)">
          {MOCK_DRAFT.adHocActions.map(h => (
            <Row
              key={h.changeId}
              id={h.changeId}
              title={h.name}
              bucket={BUCKET_LABEL[h.bucket]}
              meta={actualsLine(h)}
              needsReview={h.needsReview}
              selected={selected.has(h.changeId)}
              onToggle={toggle}
            />
          ))}
        </Group>

        <Group label="Observations">
          {MOCK_DRAFT.observations.map(o => (
            <Row
              key={o.changeId}
              id={o.changeId}
              title={observationTitle(o.type, o.severity)}
              bucket={o.bodyArea ?? 'General'}
              meta={o.note}
              needsReview={o.needsReview}
              selected={selected.has(o.changeId)}
              onToggle={toggle}
            />
          ))}
        </Group>

        {nudgeOpen &&
          MOCK_DRAFT.planChangeSuggestions.map((s, i) => (
            <div
              key={i}
              className="mx-3 rounded-md border border-dashed border-border bg-muted/40 px-3 py-2.5"
            >
              <p className="text-xs text-muted-foreground">{s.text}</p>
              <div className="flex items-center gap-3 mt-2">
                <button className="inline-flex items-center gap-1 text-xs font-medium text-foreground hover:underline">
                  Open plan review <ArrowRight className="size-3" />
                </button>
                <button
                  className="text-xs text-muted-foreground hover:underline"
                  onClick={() => setNudgeOpen(false)}
                >
                  Not now
                </button>
              </div>
            </div>
          ))}
      </div>

      <div className="border-t border-border px-4 py-3 flex items-center justify-between gap-3">
        <Badge variant="secondary">
          {count} of {total} selected
        </Badge>
        <Button size="sm" disabled={count === 0}>
          Save {count}
        </Button>
      </div>
    </div>
  )
}
