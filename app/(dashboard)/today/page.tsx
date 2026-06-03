'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@clerk/nextjs'
import { useApiClient } from '@/hooks/use-api-client'

export default function TodayRedirectPage() {
  const router = useRouter()
  const { isLoaded, isSignedIn } = useAuth()
  const { apiClient, isReady } = useApiClient()

  useEffect(() => {
    if (!isLoaded) return
    if (!isSignedIn) {
      router.replace('/sign-in?redirect_url=/today')
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
        router.replace(`/dogs/${dogs[0].id}/today`)
      } catch {
        router.replace('/sign-in?redirect_url=/today')
      }
    })()
  }, [apiClient, isReady, isLoaded, isSignedIn, router])

  return (
    <div className="min-h-screen bg-background flex items-center justify-center text-muted-foreground">
      Opening Stark&apos;s care log…
    </div>
  )
}
