import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { TodayPageClient } from './TodayPageClient'

export default async function TodayPage({ params }: { params: Promise<{ dogId: string }> }) {
  const { userId } = await auth()
  if (!userId) {
    redirect('/sign-in?redirect_url=/today')
  }

  const { dogId } = await params
  return <TodayPageClient dogId={dogId} />
}
