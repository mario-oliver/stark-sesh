import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { CompanionPageClient } from './CompanionPageClient'

export default async function CompanionPage({ params }: { params: Promise<{ dogId: string }> }) {
  const { userId } = await auth()
  if (!userId) {
    redirect('/sign-in')
  }

  const { dogId } = await params
  return <CompanionPageClient dogId={dogId} />
}
