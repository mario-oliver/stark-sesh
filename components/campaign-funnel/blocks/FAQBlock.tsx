import type { FAQBlock as FAQBlockType } from '@/lib/campaign-funnel/types'

export function FAQBlock({ data }: { data: FAQBlockType }) {
  return (
    <section className="py-12 px-6 max-w-2xl mx-auto pb-20">
      <h2 className="text-2xl font-semibold text-zinc-100 mb-8 text-center">FAQ</h2>
      <dl className="space-y-6">
        {data.items.map((item, i) => (
          <div key={i}>
            <dt className="font-medium text-zinc-200 mb-1">{item.question}</dt>
            <dd className="text-zinc-500 text-sm">{item.answer}</dd>
          </div>
        ))}
      </dl>
    </section>
  )
}
