import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { HistoryClient } from './HistoryClient'

export default async function DogHistoryPage({ params }: { params: Promise<{ dogId: string }> }) {
  const { userId } = await auth()
  if (!userId) redirect('/sign-in?redirect_url=/today')

  const { dogId } = await params
  return <HistoryClient dogId={dogId} />
}
