import type { HeroBlock as HeroBlockType } from '@/lib/campaign-funnel/types'
import { MarketingHero } from '@/components/marketing/MarketingHero'

export function HeroBlock({
  data,
  onCtaClick
}: {
  data: HeroBlockType
  onCtaClick?: () => void
}) {
  return (
    <MarketingHero
      headline={data.headline}
      subheadline={data.subheadline}
      align="center"
      className="min-h-[420px]"
    >
      <button
        type="button"
        onClick={onCtaClick}
        className="bg-primary-brand hover:bg-primary-brand-hover text-white font-semibold rounded-full h-12 px-8 transition-colors"
      >
        {data.ctaText}
      </button>
    </MarketingHero>
  )
}
