'use client'

/**
 * Variant C — "Conversational Receipt"
 * THROWAWAY prototype (issue 0016). Leans all the way into the voice-first / agent
 * framing: the draft is the assistant talking back in a chat thread. Items are
 * toggle "pills" inside a receipt bubble — tap to strike one out. The clarifying
 * question is just the next message with quick-reply chips; the plan nudge is a
 * follow-up assistant message.
 */

import { useState } from 'react'
import { Check, Dog, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
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
  defaultSelected,
  observationTitle,
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

function Pill({
  title,
  meta,
  needsReview,
  included,
  onToggle
}: {
  title: string
  meta?: string | null
  needsReview: boolean
  included: boolean
  onToggle: () => void
}) {
  return (
    <button
      onClick={onToggle}
      className={[
        'w-full text-left rounded-xl px-3 py-2 border transition-colors',
        included
          ? 'bg-background border-border'
          : 'bg-transparent border-dashed border-border/70'
      ].join(' ')}
    >
      <div className="flex items-center gap-2">
        <span
          className={[
            'size-4 shrink-0 rounded-full border flex items-center justify-center',
            included ? 'bg-primary border-primary text-primary-foreground' : 'border-muted-foreground/40'
          ].join(' ')}
        >
          {included && <Check className="size-2.5" />}
        </span>
        <span
          className={`text-sm font-medium ${included ? 'text-foreground' : 'text-muted-foreground line-through'}`}
        >
          {title}
        </span>
        {needsReview && (
          <span className="ml-auto text-[10px] font-medium text-amber-600 dark:text-amber-500">
            double-check
          </span>
        )}
      </div>
      {meta && (
        <p
          className={`text-xs mt-0.5 pl-6 ${included ? 'text-muted-foreground' : 'text-muted-foreground/60 line-through'}`}
        >
          {meta}
        </p>
      )}
    </button>
  )
}

export function VariantC({ scenario }: { scenario: Scenario }) {
  const [selected, setSelected] = useState<Set<string>>(() => defaultSelected(MOCK_DRAFT))

  const toggle = (id: string) =>
    setSelected(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })

  const included = (id: string) => selected.has(id)

  if (scenario === 'EMPTY') {
    return (
      <div className="px-4 py-5 space-y-3">
        <AgentBubble>
          <p className="text-sm text-foreground">{EMPTY_AGENT_MESSAGE}</p>
          <p className="text-xs text-muted-foreground mt-1">
            Want to try saying it a different way?
          </p>
        </AgentBubble>
        <div className="pl-9">
          <Button variant="outline" size="sm">
            Record again
          </Button>
        </div>
      </div>
    )
  }

  if (scenario === 'AWAITING_INPUT') {
    return (
      <div className="px-4 py-5 space-y-3">
        <AgentBubble>
          <p className="text-sm text-foreground">{MOCK_QUESTION.question}</p>
        </AgentBubble>
        <div className="pl-9 flex flex-wrap gap-2">
          {MOCK_QUESTION.options.map(opt => (
            <button
              key={opt.id}
              className="rounded-full border border-border bg-card px-3 py-1.5 text-sm hover:border-primary/60 hover:bg-primary/5"
              title={opt.hint}
            >
              {opt.label}
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
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        <p className="text-[11px] text-muted-foreground text-center italic px-4">
          &ldquo;{MOCK_TRANSCRIPT}&rdquo;
        </p>

        <AgentBubble>
          <p className="text-sm text-foreground">
            Here&apos;s what I caught from that. Tap any to leave it out, then save.
          </p>
        </AgentBubble>

        <div className="pl-9 space-y-3">
          <div className="rounded-2xl border border-border bg-card/60 p-3 space-y-3">
            <div className="space-y-1.5">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                Did today
              </p>
              {[...MOCK_DRAFT.completions, ...MOCK_DRAFT.adHocActions].map(item => {
                const isCompletion = 'nameSnapshot' in item
                return (
                  <Pill
                    key={item.changeId}
                    title={isCompletion ? item.nameSnapshot : item.name}
                    meta={`${BUCKET_LABEL[item.bucket]}${actualsLine(item) ? ` · ${actualsLine(item)}` : ''}${isCompletion ? '' : ' · not on plan'}`}
                    needsReview={item.needsReview}
                    included={included(item.changeId)}
                    onToggle={() => toggle(item.changeId)}
                  />
                )
              })}
            </div>

            <div className="space-y-1.5">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                Noticed
              </p>
              {MOCK_DRAFT.observations.map(o => (
                <Pill
                  key={o.changeId}
                  title={observationTitle(o.type, o.severity)}
                  meta={`${o.bodyArea ? `${o.bodyArea} · ` : ''}${o.note}`}
                  needsReview={o.needsReview}
                  included={included(o.changeId)}
                  onToggle={() => toggle(o.changeId)}
                />
              ))}
            </div>
          </div>
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
