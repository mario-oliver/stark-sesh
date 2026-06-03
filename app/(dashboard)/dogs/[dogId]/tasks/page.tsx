import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { TasksPageClient } from './TasksPageClient'

export default async function TasksPage({ params }: { params: Promise<{ dogId: string }> }) {
  const { userId } = await auth()
  if (!userId) {
    redirect('/sign-in?redirect_url=/today')
  }

  const { dogId } = await params
  return <TasksPageClient dogId={dogId} />
}
