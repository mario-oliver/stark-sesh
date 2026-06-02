import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { TeamDetailClient } from './TeamDetailClient'

export default async function TeamPage({ params }: { params: Promise<{ id: string }> }) {
  const { userId } = await auth()
  const { id } = await params
  if (!userId) redirect(`/sign-in?redirect_url=/teams/${id}`)

  return <TeamDetailClient teamId={id} />
}

