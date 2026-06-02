import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { Suspense } from 'react'
import { CampaignFunnelShell } from '@/components/campaign-funnel/CampaignFunnelShell'

export default async function CampaignFunnelSlugPage({
  params
}: {
  params: Promise<{ slug: string }>
}) {
  const { userId } = await auth()
  const { slug } = await params
  if (!userId) redirect(`/sign-in?redirect_url=${encodeURIComponent(`/campaign-funnel/${slug}`)}`)

  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#0c0c0c] flex items-center justify-center text-zinc-500">
          Loading…
        </div>
      }
    >
      <CampaignFunnelShell mode="view" slug={slug} />
    </Suspense>
  )
}
