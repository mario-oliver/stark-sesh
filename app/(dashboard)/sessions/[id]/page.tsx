import { Suspense } from 'react'
import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { SessionDetailContent } from './SessionDetailContent'

export default async function SessionPage({ params }: { params: Promise<{ id: string }> }) {
  const { userId } = await auth()
  const { id } = await params
  if (!userId) redirect(`/sign-in?redirect_url=/sessions/${id}`)
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#0c0c0c] flex items-center justify-center text-zinc-500">
          Loading session…
        </div>
      }
    >
      <SessionDetailContent sessionId={id} />
    </Suspense>
  )
}
