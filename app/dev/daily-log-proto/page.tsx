'use client'

/**
 * THROWAWAY dev playground for issue 0016 — three side-by-side DAILY_LOG
 * draft-review prototypes against the *paper* Contract (mock data only).
 *
 * Route: /dev/daily-log-proto  (intentionally outside the (dashboard) auth group
 * so it needs no sign-in). Delete `app/dev/` once Mario picks a variant — nothing
 * else imports from here.
 */

import { useState } from 'react'
import type { Scenario } from './fixtures'
import { VariantA } from './VariantA'
import { VariantB } from './VariantB'
import { VariantC } from './VariantC'
import { VariantD } from './VariantD'

const SCENARIOS: { id: Scenario; label: string; blurb: string }[] = [
  { id: 'DRAFT_READY', label: 'Draft ready', blurb: 'Full draft — three groups, two flagged items, a plan nudge.' },
  { id: 'AWAITING_INPUT', label: 'Awaiting input', blurb: 'One blocking clarifying question (ADR-0003 §5).' },
  { id: 'EMPTY', label: 'Empty', blurb: 'Nothing loggable in the note (ADR-0003 §9).' }
]

const VARIANTS: {
  key: string
  name: string
  tagline: string
  note: string
  Component: (p: { scenario: Scenario }) => React.ReactElement
}[] = [
  {
    key: 'A',
    name: 'A · Checklist Review',
    tagline: 'Dense, familiar, scannable',
    note:
      'Every item is a checkbox row grouped by kind (Completed / Ad-hoc / Observations), confirm bar pinned with a live count. Closest to today’s care UI — lowest learning cost, fastest to scan when there are many items. Risk: can read as a wall of checkboxes and under-sell the "review the flagged ones" moment.',
    Component: VariantA
  },
  {
    key: 'B',
    name: 'B · Triage by Confidence',
    tagline: 'Attention-first, opt-in for the uncertain',
    note:
      'Re-orders by confidence, not kind: flagged/low-confidence items float into a "Needs a look" tray (left out until you tap to keep), confident ones sit pre-kept below with a confidence meter. Best at protecting against a misheard transcript. Risk: extra cognitive model ("why is this up here?") and it breaks the plan/ad-hoc/observation grouping.',
    Component: VariantB
  },
  {
    key: 'C',
    name: 'C · Conversational Receipt',
    tagline: 'Voice-first, agent talks back',
    note:
      'The draft is the assistant replying in a chat thread; items are toggle pills in a receipt bubble, the clarifying question is just the next message, the plan nudge is a follow-up bubble. Most on-brand for a voice-first product and the smoothest AWAITING_INPUT. Risk: most vertical space, least scannable when the draft is long, and chat affordances can feel heavier than a checklist for a quick daily save.',
    Component: VariantC
  }
]

export default function DailyLogProtoPage() {
  const [scenario, setScenario] = useState<Scenario>('DRAFT_READY')
  const active = SCENARIOS.find(s => s.id === scenario)!

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-6xl px-4 py-8 space-y-6">
        <header className="space-y-2">
          <p className="text-xs font-mono text-muted-foreground">
            issue 0016 · throwaway prototype · mock data only
          </p>
          <h1 className="text-2xl font-semibold">DAILY_LOG draft review — pick a variant</h1>
          <p className="text-sm text-muted-foreground max-w-2xl">
            “Here’s what I heard from your voice note — deselect anything wrong, then save.”
            Three interaction designs, same mock draft. Flip the scenario to see each one
            handle all four states, then pick the interaction you want built for real (0017).
          </p>
        </header>

        <div className="flex flex-wrap items-center gap-2">
          {SCENARIOS.map(s => (
            <button
              key={s.id}
              onClick={() => setScenario(s.id)}
              className={[
                'rounded-full px-3.5 py-1.5 text-sm font-medium border transition-colors',
                scenario === s.id
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'bg-card border-border text-foreground hover:bg-accent/40'
              ].join(' ')}
            >
              {s.label}
            </button>
          ))}
          <span className="text-xs text-muted-foreground ml-1">{active.blurb}</span>
        </div>

        {/* Featured: the chosen hybrid */}
        <section className="rounded-2xl border border-primary/30 bg-primary/[0.03] p-5 space-y-3">
          <div className="flex items-baseline justify-between gap-3 flex-wrap">
            <div>
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <span className="rounded-full bg-primary text-primary-foreground text-xs px-2 py-0.5">
                  Chosen direction
                </span>
                D · Hybrid
              </h2>
              <p className="text-xs text-muted-foreground mt-1">
                C&apos;s transcript + agent framing · A&apos;s category sections · B&apos;s confidence
                container · C&apos;s plan nudge. Awaiting-input uses B (white cards); empty uses A
                with a Stark Sprite.
              </p>
            </div>
          </div>
          <div className="mx-auto w-full max-w-sm">
            <div className="h-[560px] rounded-3xl border border-border bg-card shadow-sm overflow-hidden flex flex-col">
              <div className="h-9 shrink-0 border-b border-border bg-muted/40 flex items-center justify-center">
                <span className="text-[11px] text-muted-foreground">Stark · Today</span>
              </div>
              <div className="flex-1 min-h-0">
                <VariantD scenario={scenario} />
              </div>
            </div>
          </div>
        </section>

        <h2 className="text-sm font-semibold text-muted-foreground pt-2">
          Source variants (kept for reference)
        </h2>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          {VARIANTS.map(v => (
            <section key={v.key} className="space-y-3">
              <div>
                <h2 className="text-base font-semibold">{v.name}</h2>
                <p className="text-xs text-muted-foreground">{v.tagline}</p>
              </div>

              {/* phone-ish frame */}
              <div className="mx-auto w-full max-w-sm">
                <div className="h-[560px] rounded-3xl border border-border bg-card shadow-sm overflow-hidden flex flex-col">
                  <div className="h-9 shrink-0 border-b border-border bg-muted/40 flex items-center justify-center">
                    <span className="text-[11px] text-muted-foreground">Stark · Today</span>
                  </div>
                  <div className="flex-1 min-h-0">
                    <v.Component scenario={scenario} />
                  </div>
                </div>
              </div>

              <p className="text-xs text-muted-foreground leading-relaxed">{v.note}</p>
            </section>
          ))}
        </div>

        <footer className="border-t border-border pt-4 text-xs text-muted-foreground">
          Pre-selection follows ADR-0003 §3: confident items start selected, flagged
          (<span className="text-amber-600 dark:text-amber-500">needsReview</span>) items
          are surfaced but opt-in. Plan-change suggestions are inert — they never commit
          (ADR-0003 §8).
        </footer>
      </div>
    </div>
  )
}
