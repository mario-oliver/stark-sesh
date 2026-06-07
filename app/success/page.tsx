'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuth } from '@clerk/nextjs'
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useApiClient } from '@/hooks/use-api-client'

export default function SuccessPage() {
  const router = useRouter()
  const { isLoaded, isSignedIn } = useAuth()
  const { apiClient, isReady } = useApiClient()
  const [status, setStatus] = useState<'syncing' | 'done' | 'error'>('syncing')
  const [message, setMessage] = useState('Confirming your subscription…')

  useEffect(() => {
    if (!isLoaded) return
    if (!isSignedIn) {
      router.replace('/sign-in?redirect_url=/success')
      return
    }
    if (!isReady) return

    let cancelled = false

    async function sync() {
      try {
        await apiClient.syncStripeSubscription()
        if (cancelled) return
        setStatus('done')
        setMessage('Subscription active. Redirecting…')
        setTimeout(() => router.replace('/today'), 1500)
      } catch (err) {
        if (cancelled) return
        setStatus('error')
        setMessage(err instanceof Error ? err.message : 'Could not confirm subscription')
      }
    }

    void sync()
    return () => {
      cancelled = true
    }
  }, [apiClient, isLoaded, isReady, isSignedIn, router])

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-6 px-6 text-center">
      {status === 'syncing' && <Loader2 className="w-10 h-10 animate-spin text-primary" />}
      <h1 className="text-2xl font-semibold">
        {status === 'error' ? 'Something went wrong' : 'Thank you!'}
      </h1>
      <p className="text-muted-foreground max-w-md">{message}</p>
      {status === 'error' && (
        <div className="flex gap-3">
          <Button asChild variant="outline" className="rounded-full">
            <Link href="/pricing">Back to pricing</Link>
          </Button>
          <Button asChild className="rounded-full">
            <Link href="/today">Continue to app</Link>
          </Button>
        </div>
      )}
    </div>
  )
}
