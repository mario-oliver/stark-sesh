'use client'

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import type { SpriteSource } from '@/lib/sprites/source'
import { BUNDLED_SOURCE, buildRemoteSource } from '@/lib/sprites/source'
import { useApiClient } from '@/hooks/use-api-client'

const SpriteSourceContext = createContext<SpriteSource>(BUNDLED_SOURCE)

export function useSpriteSource(): SpriteSource {
  return useContext(SpriteSourceContext)
}

type Props = {
  dogId: string
  children: ReactNode
}

/**
 * Fetches the active sprite set for the dog and provides the resolved
 * SpriteSource to all descendants. Defaults to BUNDLED_SOURCE while loading
 * or if no custom set exists.
 */
export function SpriteSourceProvider({ dogId, children }: Props) {
  const { apiClient, isReady } = useApiClient()
  const [source, setSource] = useState<SpriteSource>(BUNDLED_SOURCE)

  useEffect(() => {
    if (!isReady) return

    let cancelled = false
    apiClient.getDogSpriteSet(dogId)
      .then((res) => {
        if (cancelled) return
        const spriteSet = res.data
        if (spriteSet) {
          setSource(buildRemoteSource(spriteSet))
        }
      })
      .catch(() => {
        // Network failure — stay bundled
      })

    return () => { cancelled = true }
  }, [dogId, isReady, apiClient])

  return (
    <SpriteSourceContext.Provider value={source}>
      {children}
    </SpriteSourceContext.Provider>
  )
}
