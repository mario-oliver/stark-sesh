'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function TasksRedirectPage() {
  const router = useRouter()

  useEffect(() => {
    router.replace('/exercises')
  }, [router])

  return (
    <div className="min-h-screen bg-background flex items-center justify-center text-muted-foreground">
      Loading…
    </div>
  )
}
