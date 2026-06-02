import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { Suspense } from 'react'
import { CampaignFunnelShell } from '@/components/campaign-funnel/CampaignFunnelShell'

export default async function CampaignFunnelCreatePage() {
  const { userId } = await auth()
  if (!userId) redirect('/sign-in?redirect_url=/campaign-funnel')

  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#0c0c0c] flex items-center justify-center text-zinc-500">
          Loading…
        </div>
      }
    >
      <CampaignFunnelShell mode="create" />
    </Suspense>
  )
}
