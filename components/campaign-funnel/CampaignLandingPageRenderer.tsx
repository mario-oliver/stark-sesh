'use client'

import { useEffect, useRef } from 'react'
import type { CampaignVariant } from '@/lib/campaign-funnel/types'
import {
  trackCtaClick,
  trackLandingView,
  trackScrollDepth,
  trackSignupStart,
  type CampaignAnalyticsContext
} from '@/lib/analytics/campaign-events'
import { HeroBlock } from './blocks/HeroBlock'
import { ProblemBlock } from './blocks/ProblemBlock'
import { SolutionBlock } from './blocks/SolutionBlock'
import { HowItWorksBlock } from './blocks/HowItWorksBlock'
import { ProofBlock } from './blocks/ProofBlock'
import { CTASection } from './blocks/CTASection'
import { FAQBlock } from './blocks/FAQBlock'

type Props = {
  variant: CampaignVariant
  campaignName: string
  pageId: string
  experimentId?: string
}

export function CampaignLandingPageRenderer({ variant, campaignName, pageId, experimentId }: Props) {
  const ctx: CampaignAnalyticsContext = {
    variant_id: variant.id,
    angle: variant.angle,
    campaign_name: campaignName,
    page_id: pageId,
    experiment_id: experimentId
  }

  const scrollMarks = useRef(new Set<number>())

  useEffect(() => {
    trackLandingView(ctx)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [variant.id])

  useEffect(() => {
    const onScroll = () => {
      const doc = document.documentElement
      const pct = Math.round(
        ((doc.scrollTop + window.innerHeight) / doc.scrollHeight) * 100
      )
      for (const mark of [25, 50, 75, 100]) {
        if (pct >= mark && !scrollMarks.current.has(mark)) {
          scrollMarks.current.add(mark)
          trackScrollDepth({ ...ctx, depth_pct: mark })
        }
      }
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [variant.id])

  const handleCta = (ctaText: string) => {
    trackCtaClick({ ...ctx, cta_text: ctaText })
    trackSignupStart(ctx)
    window.location.href = '/sign-up'
  }

  return (
    <div className="min-h-screen bg-[#0c0c0c] text-zinc-100 font-sans">
      <div className="border-b border-zinc-800 px-4 py-2 text-xs text-zinc-500 text-center">
        Preview: {variant.name} · {variant.angle}
      </div>
      <HeroBlock data={variant.blocks.hero} onCtaClick={() => handleCta(variant.blocks.hero.ctaText)} />
      <ProblemBlock data={variant.blocks.problem} />
      <SolutionBlock data={variant.blocks.solution} />
      <HowItWorksBlock data={variant.blocks.howItWorks} />
      <ProofBlock data={variant.blocks.proof} />
      <CTASection
        data={variant.blocks.cta}
        onCtaClick={() => handleCta(variant.blocks.cta.buttonText)}
      />
      <FAQBlock data={variant.blocks.faq} />
    </div>
  )
}
