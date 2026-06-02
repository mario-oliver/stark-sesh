import type { HowItWorksBlock as HowItWorksBlockType } from '@/lib/campaign-funnel/types'

export function HowItWorksBlock({ data }: { data: HowItWorksBlockType }) {
  return (
    <section className="py-12 px-6 max-w-3xl mx-auto">
      <h2 className="text-2xl font-semibold text-zinc-100 mb-8 text-center">How it works</h2>
      <ol className="space-y-6">
        {data.steps.map((step, i) => (
          <li key={i} className="flex gap-4">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary-brand/20 text-primary-brand font-semibold text-sm">
              {i + 1}
            </span>
            <span className="text-zinc-300 pt-1">{step}</span>
          </li>
        ))}
      </ol>
    </section>
  )
}
