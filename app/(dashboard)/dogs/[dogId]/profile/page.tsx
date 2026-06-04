import { auth } from '@clerk/nextjs/server'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { ProfileClient } from './ProfileClient'

export default async function DogProfilePage({ params }: { params: Promise<{ dogId: string }> }) {
  const { userId } = await auth()
  if (!userId) redirect('/sign-in?redirect_url=/profile')

  const { dogId } = await params
  return <ProfileClient dogId={dogId} />
}
