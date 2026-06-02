import type { ProblemBlock as ProblemBlockType } from '@/lib/campaign-funnel/types'

export function ProblemBlock({ data }: { data: ProblemBlockType }) {
  return (
    <section className="py-12 px-6 max-w-3xl mx-auto">
      <h2 className="text-2xl font-semibold text-zinc-100 mb-6 text-center">{data.title}</h2>
      <ul className="space-y-3">
        {data.items.map((item, i) => (
          <li key={i} className="flex gap-3 text-zinc-400">
            <span className="text-primary-brand shrink-0">•</span>
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </section>
  )
}
