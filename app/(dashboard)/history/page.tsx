'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@clerk/nextjs'
import { useApiClient } from '@/hooks/use-api-client'
import { resolveDogId } from '@/lib/active-dog'

export default function HistoryRedirectPage() {
  const router = useRouter()
  const { isLoaded, isSignedIn } = useAuth()
  const { apiClient, isReady } = useApiClient()

  useEffect(() => {
    if (!isLoaded) return
    if (!isSignedIn) {
      router.replace('/sign-in?redirect_url=/history')
      return
    }
    if (!isReady) return
    void (async () => {
      try {
        const res = await apiClient.listDogs()
        const dogs = res.data
        if (dogs.length === 0) {
          router.replace('/onboarding')
          return
        }
        router.replace(`/dogs/${resolveDogId(dogs)}/history`)
      } catch {
        router.replace('/sign-in?redirect_url=/history')
      }
    })()
  }, [apiClient, isReady, isLoaded, isSignedIn, router])

  return (
    <div className="min-h-screen bg-background flex items-center justify-center text-muted-foreground">
      Loading…
    </div>
  )
}
