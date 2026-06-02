import type { CTABlock } from '@/lib/campaign-funnel/types'

export function CTASection({
  data,
  onCtaClick
}: {
  data: CTABlock
  onCtaClick?: () => void
}) {
  return (
    <section className="py-14 px-6 max-w-2xl mx-auto text-center rounded-2xl bg-zinc-800/50 border border-zinc-700/50 mb-12">
      <h2 className="text-xl sm:text-2xl font-semibold text-zinc-100 mb-6">{data.headline}</h2>
      <button
        type="button"
        onClick={onCtaClick}
        className="bg-primary-brand hover:bg-primary-brand-hover text-white font-semibold rounded-full h-11 px-6 transition-colors"
      >
        {data.buttonText}
      </button>
    </section>
  )
}
