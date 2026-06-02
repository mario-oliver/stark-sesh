'use client'

import { use, useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'
import { CampaignLandingPageRenderer } from '@/components/campaign-funnel/CampaignLandingPageRenderer'
import type { CampaignLandingPage, CampaignVariant } from '@/lib/campaign-funnel/types'
import { buildFallbackLandingPage } from '@/lib/campaign-funnel/fallback-page'
import { getCampaign } from '@/lib/api/endpoints/campaigns'

function CampaignPreviewContent({ slug }: { slug: string }) {
  const searchParams = useSearchParams()
  const variantId = searchParams.get('variant') ?? 'variant-a'
  const [page, setPage] = useState<CampaignLandingPage | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getCampaign(slug)
      .then(c => setPage(c.page))
      .catch(() => setPage(buildFallbackLandingPage(slug)))
      .finally(() => setLoading(false))
  }, [slug])

  if (loading) {
    return <p className="p-8 text-zinc-500">Loading campaign…</p>
  }

  const landingPage = page ?? buildFallbackLandingPage(slug)
  const variant: CampaignVariant | undefined =
    landingPage.variants.find(v => v.id === variantId) ?? landingPage.variants[0]

  if (!variant) {
    return <p className="p-8 text-zinc-500">Variant not found.</p>
  }

  return (
    <CampaignLandingPageRenderer
      variant={variant}
      campaignName={landingPage.campaignName}
      pageId={slug}
      experimentId={`live-${variantId}`}
    />
  )
}

export default function CampaignPreviewPage({
  params
}: {
  params: Promise<{ pageId: string }>
}) {
  const { pageId } = use(params)

  return (
    <Suspense fallback={<p className="p-8 text-zinc-500">Loading…</p>}>
      <CampaignPreviewContent slug={pageId} />
    </Suspense>
  )
}
