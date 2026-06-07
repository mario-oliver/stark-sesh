'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { SpriteOverlay } from '@/components/sprite/SpriteOverlay'

export default function TasksRedirectPage() {
  const router = useRouter()

  useEffect(() => {
    router.replace('/exercises')
  }, [router])

  return <SpriteOverlay preset="dailyPlanLoading" mode="blocking" />
}
