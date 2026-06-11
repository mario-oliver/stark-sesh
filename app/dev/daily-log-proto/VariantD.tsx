'use client'

/**
 * Variant D — "Chosen direction" (hybrid picked by Mario, 2026-06-11)
 * THROWAWAY prototype (issue 0016). Composition:
 *   - DRAFT_READY: C's transcript + agent intro bubble  ->  A's category sections
 *     (Completed from plan / Also did / Observations)  ->  B's per-item container
 *     with the confidence score top-right (kind label dropped — the section header
 *     carries it), bucket + actuals kept, cards tinted blue vs the background  ->
 *     C's conversational plan-change nudge bubble.
 *   - AWAITING_INPUT: B's triage prompt, with the candidate cards in white so they
 *     stand out.
 *   - EMPTY: A's empty layout, with a Stark Sprite in place of the check icon.
 */

import { useState } from 'react'
import { AlertTriangle, Check, Dog, Sparkles, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { StarkSprite } from '@/components/sprite/StarkSprite'
import {
  EMPTY_AGENT_MESSAGE,
  MOCK_DRAFT,
  MOCK_QUESTION,
  MOCK_TRANSCRIPT,
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

function AgentBubble({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-2">
      <span className="mt-0.5 size-7 shrink-0 rounded-full bg-primary/10 text-primary flex items-center justify-center">
        <Dog className="size-4" />
      </span>
      <div className="rounded-2xl rounded-tl-sm bg-muted px-3.5 py-2.5 max-w-[88%]">
        {children}
      </div>
    </div>
  )
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
    <span className="inline-flex items-center gap-1 shrink-0" title={`Confidence ${pct(c)}`}>
      {[0, 1, 2].map(i => (
        <span key={i} className={`h-1 w-3 rounded-full ${i < filled ? color : 'bg-border'}`} />
      ))}
      <span className="text-[10px] text-muted-foreground ml-0.5">{pct(c)}</span>
    </span>
  )
}

/** B's container, slimmed: no kind label (section header carries it), blue tint. */
function ItemCard({
  title,
  meta,
  confidence,
  needsReview,
  selected,
  onToggle
}: {
  title: string
  meta?: string | null
  confidence: number
  needsReview: boolean
  selected: boolean
  onToggle: () => void
}) {
  return (
    <button
      onClick={onToggle}
      className={[
        'w-full text-left rounded-xl border px-3 py-2.5 transition-colors',
        selected
          ? 'border-primary/25 bg-primary/10'
          : 'border-dashed border-border bg-transparent'
      ].join(' ')}
    >
      <div className="flex items-start gap-2.5">
        <span
          className={[
            'mt-0.5 size-5 shrink-0 rounded-full border flex items-center justify-center',
            selected ? 'bg-primary border-primary text-primary-foreground' : 'border-muted-foreground/40'
          ].join(' ')}
        >
          {selected ? <Check className="size-3" /> : <X className="size-2.5 text-muted-foreground" />}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <span
              className={`text-sm font-medium ${selected ? 'text-foreground' : 'text-muted-foreground line-through'}`}
            >
              {title}
            </span>
            <ConfidenceMeter c={confidence} />
          </div>
          <div className="flex items-center gap-2 mt-0.5">
            {meta && <p className="text-xs text-muted-foreground">{meta}</p>}
            {needsReview && (
              <span className="inline-flex items-center gap-1 text-[11px] font-medium text-amber-600 dark:text-amber-500">
                <AlertTriangle className="size-3" /> check this
              </span>
            )}
          </div>
        </div>
      </div>
    </button>
  )
}

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      {children}
    </div>
  )
}

export function VariantD({ scenario }: { scenario: Scenario }) {
  const [selected, setSelected] = useState<Set<string>>(() => defaultSelected(MOCK_DRAFT))

  const toggle = (id: string) =>
    setSelected(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })

  // EMPTY — A's layout, Stark Sprite swapped in for the icon.
  if (scenario === 'EMPTY') {
    return (
      <div className="px-4 py-8 text-center space-y-3 flex flex-col items-center">
        <StarkSprite animation="idle" size="small" />
        <p className="text-sm text-muted-foreground">{EMPTY_AGENT_MESSAGE}</p>
        <Button variant="outline" size="sm">
          Record again
        </Button>
      </div>
    )
  }

  // AWAITING_INPUT — B's prompt, candidate cards in white to stand out.
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
              className="rounded-lg border border-border bg-white dark:bg-zinc-900 shadow-sm px-3 py-2.5 text-left hover:border-primary/60 hover:shadow"
            >
              <span className="text-sm font-medium block">{opt.label}</span>
              {opt.hint && <span className="text-xs text-muted-foreground">{opt.hint}</span>}
            </button>
          ))}
        </div>
      </div>
    )
  }

  // DRAFT_READY — the hybrid.
  const total = totalSelectable(MOCK_DRAFT)
  const count = selected.size

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        <p className="text-[11px] text-muted-foreground text-center italic px-2">
          &ldquo;{MOCK_TRANSCRIPT}&rdquo;
        </p>

        <AgentBubble>
          <p className="text-sm text-foreground">
            Here&apos;s what I caught from that. Tap any to leave it out, then save.
          </p>
        </AgentBubble>

        <div className="space-y-4 pt-1">
          <Section label="Completed from plan">
            {MOCK_DRAFT.completions.map(c => (
              <ItemCard
                key={c.changeId}
                title={c.nameSnapshot}
                meta={[BUCKET_LABEL[c.bucket], actualsLine(c)].filter(Boolean).join(' · ')}
                confidence={c.extractionConfidence}
                needsReview={c.needsReview}
                selected={selected.has(c.changeId)}
                onToggle={() => toggle(c.changeId)}
              />
            ))}
          </Section>

          <Section label="Also did (not on plan)">
            {MOCK_DRAFT.adHocActions.map(h => (
              <ItemCard
                key={h.changeId}
                title={h.name}
                meta={[BUCKET_LABEL[h.bucket], actualsLine(h)].filter(Boolean).join(' · ')}
                confidence={h.extractionConfidence}
                needsReview={h.needsReview}
                selected={selected.has(h.changeId)}
                onToggle={() => toggle(h.changeId)}
              />
            ))}
          </Section>

          <Section label="Observations">
            {MOCK_DRAFT.observations.map(o => (
              <ItemCard
                key={o.changeId}
                title={observationTitle(o.type, o.severity)}
                meta={[o.bodyArea, o.note].filter(Boolean).join(' · ')}
                confidence={o.extractionConfidence}
                needsReview={o.needsReview}
                selected={selected.has(o.changeId)}
                onToggle={() => toggle(o.changeId)}
              />
            ))}
          </Section>
        </div>

        {MOCK_DRAFT.planChangeSuggestions.map((s, i) => (
          <AgentBubble key={i}>
            <p className="text-sm text-foreground flex items-start gap-1.5">
              <Sparkles className="size-4 mt-0.5 shrink-0 text-primary" />
              <span>
                {s.text}{' '}
                <button className="font-medium text-primary underline-offset-2 hover:underline">
                  Open a plan review?
                </button>
              </span>
            </p>
          </AgentBubble>
        ))}
      </div>

      <div className="border-t border-border px-4 py-3 flex items-center justify-between gap-3">
        <span className="text-xs text-muted-foreground">
          Saving {count} of {total}
        </span>
        <Button size="sm" disabled={count === 0}>
          Save to today
        </Button>
      </div>
    </div>
  )
}
