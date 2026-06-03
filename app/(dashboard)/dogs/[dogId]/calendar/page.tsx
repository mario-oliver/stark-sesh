import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { CalendarPageClient } from './CalendarPageClient'

export default async function CalendarPage({
  params,
  searchParams
}: {
  params: Promise<{ dogId: string }>
  searchParams: Promise<{ date?: string }>
}) {
  const { userId } = await auth()
  if (!userId) {
    redirect('/sign-in?redirect_url=/today')
  }

  const { dogId } = await params
  const { date } = await searchParams

  return <CalendarPageClient dogId={dogId} initialDate={date} />
}
