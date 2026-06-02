import type { ProofBlock as ProofBlockType } from '@/lib/campaign-funnel/types'

export function ProofBlock({ data }: { data: ProofBlockType }) {
  return (
    <section className="py-12 px-6 max-w-3xl mx-auto text-center">
      <h2 className="text-xl font-semibold text-zinc-100 mb-3">{data.title}</h2>
      <p className="text-zinc-500">{data.body}</p>
    </section>
  )
}
