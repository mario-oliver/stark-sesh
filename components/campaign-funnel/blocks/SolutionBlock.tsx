import type { SolutionBlock as SolutionBlockType } from '@/lib/campaign-funnel/types'

export function SolutionBlock({ data }: { data: SolutionBlockType }) {
  return (
    <section className="py-12 px-6 max-w-3xl mx-auto rounded-2xl bg-zinc-800/40 border border-zinc-700/50">
      <h2 className="text-2xl font-semibold text-zinc-100 mb-4">{data.title}</h2>
      <p className="text-zinc-400 leading-relaxed">{data.body}</p>
    </section>
  )
}
