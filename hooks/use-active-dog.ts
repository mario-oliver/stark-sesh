'use client'

import { useEffect } from 'react'
import { setActiveDogId } from '@/lib/active-dog'

export function useActiveDog(dogId: string) {
  useEffect(() => {
    setActiveDogId(dogId)
  }, [dogId])
}
