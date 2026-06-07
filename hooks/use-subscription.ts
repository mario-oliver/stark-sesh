'use client'

import { useCallback, useEffect, useState } from 'react'
import { useAuth } from '@clerk/nextjs'
import { useApiClient } from '@/hooks/use-api-client'
import type { EntitlementResult, SubscriptionPayload } from '@/lib/api/endpoints/subscription'

export function useSubscription() {
  const { isSignedIn, isLoaded } = useAuth()
  const { apiClient, isReady } = useApiClient()
  const [data, setData] = useState<SubscriptionPayload | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    if (!isReady) return null
    setLoading(true)
    setError(null)
    try {
      const response = await apiClient.getSubscription()
      if (response.success && response.data) {
        setData(response.data)
        return response.data
      }
      return null
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load subscription')
      return null
    } finally {
      setLoading(false)
    }
  }, [apiClient, isReady])

  useEffect(() => {
    if (isLoaded && isSignedIn && isReady) {
      void refresh()
    }
  }, [isLoaded, isSignedIn, isReady, refresh])

  const entitlement: EntitlementResult | null = data?.entitlement ?? null

  const subscribe = useCallback(
    async (priceId: string) => {
      const response = await apiClient.createCheckoutSession({ priceId })
      if (response.success && response.data?.url) {
        window.location.href = response.data.url
      } else {
        throw new Error('Failed to start checkout')
      }
    },
    [apiClient]
  )

  const openPortal = useCallback(async () => {
    const response = await apiClient.createPortalSession()
    if (response.success && response.data?.url) {
      window.location.href = response.data.url
    } else {
      throw new Error('Failed to open billing portal')
    }
  }, [apiClient])

  return {
    data,
    entitlement,
    hasPro: entitlement?.hasPro ?? false,
    hasBasic: entitlement?.hasBasic ?? false,
    loading,
    error,
    refresh,
    subscribe,
    openPortal
  }
}
