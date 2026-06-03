'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@clerk/nextjs'
import { useApiClient } from '@/hooks/use-api-client'

function DogRedirectPage({ path }: { path: 'tasks' | 'calendar' }) {
  const router = useRouter()
  const { isLoaded, isSignedIn } = useAuth()
  const { apiClient, isReady } = useApiClient()

  useEffect(() => {
    if (!isLoaded) return
    if (!isSignedIn) {
      router.replace(`/sign-in?redirect_url=/${path}`)
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
        router.replace(`/dogs/${dogs[0].id}/${path}`)
      } catch {
        router.replace(`/sign-in?redirect_url=/${path}`)
      }
    })()
  }, [apiClient, isReady, isLoaded, isSignedIn, path, router])

  return (
    <div className="min-h-screen bg-[#0c0c0c] flex items-center justify-center text-zinc-500">
      Loading…
    </div>
  )
}

export default function TasksRedirectPage() {
  return <DogRedirectPage path="tasks" />
}
