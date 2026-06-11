'use client'

/**
 * Variant B — "Triage by Confidence"
 * THROWAWAY prototype (issue 0016). Re-orders the draft by *attention* instead
 * of by kind: flagged / low-confidence items float into a "Needs a look" tray at
 * the top (opt-in), confident items sit in "Looks good" pre-kept below. Each item
 * is a tappable card showing a confidence meter; tap to keep/skip.
 */

import { useState } from 'react'
import { AlertTriangle, Check, Sparkles, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  EMPTY_AGENT_MESSAGE,
  MOCK_DRAFT,
  MOCK_QUESTION,
  type Scenario
} from './fixtures'
import {
  BUCKET_LABEL,
  actualsLine,
  confidenceLabel,
  defaultSelected,
  observationTitle,
  pct,
  totalSelectable
} from './shared'

type Flat = {
  changeId: string
  kind: 'Completed' | 'Ad-hoc' | 'Observation'
  title: string
  bucket: string
  meta?: string | null
  confidence: number
  needsReview: boolean
}

function flatten(): Flat[] {
  return [
    ...MOCK_DRAFT.completions.map(c => ({
      changeId: c.changeId,
      kind: 'Completed' as const,
      title: c.nameSnapshot,
      bucket: BUCKET_LABEL[c.bucket],
      meta: actualsLine(c),
      confidence: c.extractionConfidence,
      needsReview: c.needsReview
    })),
    ...MOCK_DRAFT.adHocActions.map(h => ({
      changeId: h.changeId,
      kind: 'Ad-hoc' as const,
      title: h.name,
      bucket: BUCKET_LABEL[h.bucket],
      meta: actualsLine(h),
      confidence: h.extractionConfidence,
      needsReview: h.needsReview
    })),
    ...MOCK_DRAFT.observations.map(o => ({
      changeId: o.changeId,
      kind: 'Observation' as const,
      title: observationTitle(o.type, o.severity),
      bucket: o.bodyArea ?? 'General',
      meta: o.note,
      confidence: o.extractionConfidence,
      needsReview: o.needsReview
    }))
  ]
}

function ConfidenceMeter({ c }: { c: number }) {
  const level = confidenceLabel(c)
  const filled = level === 'high' ? 3 : level === 'medium' ? 2 : 1
  const color =
    level === 'high'
      ? 'bg-emerald-500'
      : level === 'medium'
        ? 'bg-amber-500'
        : 'bg-destructive'
  return (
    <span className="inline-flex items-center gap-1" title={`Confidence ${pct(c)}`}>
      {[0, 1, 2].map(i => (
        <span
          key={i}
          className={`h-1 w-3 rounded-full ${i < filled ? color : 'bg-border'}`}
        />
      ))}
      <span className="text-[10px] text-muted-foreground ml-0.5">{pct(c)}</span>
    </span>
  )
}

function ItemCard({
  item,
  selected,
  onToggle
}: {
  item: Flat
  selected: boolean
  onToggle: (id: string) => void
}) {
  return (
    <button
      onClick={() => onToggle(item.changeId)}
      className={[
        'w-full text-left rounded-lg border px-3 py-2.5 transition-colors',
        selected
          ? 'border-primary/60 bg-primary/5'
          : 'border-border bg-card opacity-60',
        item.needsReview && !selected ? 'border-amber-500/50' : ''
      ].join(' ')}
    >
      <div className="flex items-start gap-3">
        <span
          className={[
            'mt-0.5 size-5 shrink-0 rounded-full border flex items-center justify-center',
            selected ? 'bg-primary border-primary text-primary-foreground' : 'border-border'
          ].join(' ')}
        >
          {selected ? <Check className="size-3.5" /> : <X className="size-3 text-muted-foreground" />}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <span
              className={`text-sm font-medium ${selected ? 'text-foreground' : 'text-muted-foreground line-through'}`}
            >
              {item.title}
            </span>
            <ConfidenceMeter c={item.confidence} />
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            <span className="text-foreground/70">{item.kind}</span> · {item.bucket}
            {item.meta ? ` · ${item.meta}` : ''}
          </p>
        </div>
      </div>
    </button>
  )
}

export function VariantB({ scenario }: { scenario: Scenario }) {
  const [selected, setSelected] = useState<Set<string>>(() => defaultSelected(MOCK_DRAFT))

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
          <Sparkles className="size-5 text-muted-foreground" />
        </div>
        <p className="text-sm text-muted-foreground">{EMPTY_AGENT_MESSAGE}</p>
        <Button variant="outline" size="sm">
          Try again
        </Button>
      </div>
    )
  }

  if (scenario === 'AWAITING_INPUT') {
    return (
      <div className="px-4 py-5 space-y-4">
        <div className="rounded-lg border border-amber-500/50 bg-amber-500/10 px-3 py-2.5">
          <p className="text-xs font-medium text-amber-700 dark:text-amber-400 flex items-center gap-1.5">
            <AlertTriangle className="size-3.5" /> I heard {MOCK_QUESTION.heard}
          </p>
          <p className="text-sm text-foreground mt-1.5">{MOCK_QUESTION.question}</p>
        </div>
        <div className="grid grid-cols-1 gap-2">
          {MOCK_QUESTION.options.map(opt => (
            <button
              key={opt.id}
              className="rounded-lg border border-border bg-card px-3 py-2.5 text-left hover:border-primary/60 hover:bg-primary/5"
            >
              <span className="text-sm font-medium block">{opt.label}</span>
              {opt.hint && <span className="text-xs text-muted-foreground">{opt.hint}</span>}
            </button>
          ))}
        </div>
      </div>
    )
  }

  const items = flatten()
  const flagged = items.filter(i => i.needsReview)
  const confident = items.filter(i => !i.needsReview)
  const total = totalSelectable(MOCK_DRAFT)
  const count = selected.size

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-5">
        {flagged.length > 0 && (
          <section className="space-y-2">
            <p className="text-xs font-semibold text-amber-600 dark:text-amber-500 flex items-center gap-1.5">
              <AlertTriangle className="size-3.5" /> Needs a look ({flagged.length})
            </p>
            <p className="text-[11px] text-muted-foreground -mt-1">
              Low confidence — left out until you tap to keep.
            </p>
            {flagged.map(item => (
              <ItemCard
                key={item.changeId}
                item={item}
                selected={selected.has(item.changeId)}
                onToggle={toggle}
              />
            ))}
          </section>
        )}

        <section className="space-y-2">
          <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-500 flex items-center gap-1.5">
            <Check className="size-3.5" /> Looks good ({confident.length})
          </p>
          {confident.map(item => (
            <ItemCard
              key={item.changeId}
              item={item}
              selected={selected.has(item.changeId)}
              onToggle={toggle}
            />
          ))}
        </section>

        {MOCK_DRAFT.planChangeSuggestions.map((s, i) => (
          <div
            key={i}
            className="rounded-lg border border-primary/30 bg-primary/5 px-3 py-2.5"
          >
            <p className="text-xs font-semibold text-foreground flex items-center gap-1.5">
              <Sparkles className="size-3.5" /> Plan idea
            </p>
            <p className="text-xs text-muted-foreground mt-1">{s.text}</p>
            <Button variant="outline" size="xs" className="mt-2">
              {s.likelyAction} →
            </Button>
          </div>
        ))}
      </div>

      <div className="border-t border-border px-4 py-3 flex items-center justify-between gap-3">
        <span className="text-xs text-muted-foreground">{count} kept</span>
        <Button size="sm" disabled={count === 0}>
          Save {count} of {total}
        </Button>
      </div>
    </div>
  )
}
