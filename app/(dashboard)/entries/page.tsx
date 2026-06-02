import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { EntriesPageClient } from './EntriesPageClient'

export default async function EntriesPage() {
  const { userId } = await auth()
  if (!userId) redirect('/sign-in?redirect_url=/entries')

  return <EntriesPageClient userId={userId} />
}
