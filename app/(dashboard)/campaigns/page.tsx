import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { CampaignsPageClient } from './CampaignsPageClient'

export default async function CampaignsPage() {
  const { userId } = await auth()
  if (!userId) redirect('/sign-in?redirect_url=/campaigns')

  return <CampaignsPageClient />
}
