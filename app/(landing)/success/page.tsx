'use client'

import React, { Suspense, useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Spinner } from '@/components/ui/spinner'
import { Button } from '@/components/ui/button'
import { useUser } from '@clerk/clerk-react'
import { useApiClient } from '@/hooks/use-api-client'

// Add this metadata export to mark the route as dynamic
export const dynamic = 'force-dynamic'

const SuccessfulContent: React.FC = () => {
  const { isLoaded, isSignedIn } = useUser()
  const [status, setStatus] = useState('loading')
  const [retryCount, setRetryCount] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const { apiClient } = useApiClient()

  const checkSubscriptionStatus = useCallback(async () => {
    try {
      const response = await apiClient.getSubscription()

      // If user has active subscription, redirect to main app
      if ((response.success && response.data?.status === 'active') || response.data?.status === 'trialing') {
        router.push('/harada')
        return
      }

      // Handle the case where no subscription is found (valid for new users)
      if (response.success && response.message === 'SUBSCRIPTION_NOT_FOUND') {
        console.log('No subscription found, retrying...')
        return 'retry'
      }

      const subscription = response.data
      console.log('Subscription status:', subscription)

      if (subscription?.status === 'active' || subscription?.status === 'trialing') {
        console.log('Active subscription found, redirecting to chat...')
        router.push('/harada')
        return 'success'
      } else if (subscription?.status === 'incomplete' || subscription?.status === 'past_due') {
        console.log('Payment is being processed, retrying...')
        return 'retry'
      } else if (subscription?.status === 'canceled') {
        setError('Your subscription was canceled. Please contact support.')
        return 'failed'
      } else {
        console.log('Unknown subscription status:', subscription?.status)
        return 'retry'
      }
    } catch (error) {
      console.error('Error checking subscription:', error)
      setError('Failed to check subscription status. Please try again.')
      return 'failed'
    }
  }, [apiClient, router])

  useEffect(() => {
    // Don't fetch until auth is loaded and we have a userId
    if (!isLoaded) return

    // If user is not signed in, redirect to sign-in
    if (!isSignedIn) {
      router.push('/sign-in?redirect_url=' + encodeURIComponent('/success'))
      return
    }

    const processSubscription = async () => {
      const result = await checkSubscriptionStatus()

      if (result === 'retry' && retryCount < 15) {
        // Retry after 2 seconds, but allow more retries for payment processing
        setTimeout(() => {
          setRetryCount(prev => prev + 1)
        }, 2000)
      } else if (result === 'retry' && retryCount >= 15) {
        // Too many retries, show manual refresh option
        setStatus('timeout')
      } else if (result === 'failed') {
        setStatus('failed')
      }
    }

    processSubscription()
  }, [isLoaded, isSignedIn, retryCount, checkSubscriptionStatus, router])

  // Show loading state while auth is loading
  if (!isLoaded) {
    return <FallBackContent />
  }

  if (status === 'failed') {
    return (
      <div className="flex flex-col justify-center items-center min-h-screen space-y-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Payment Processing Error</h1>
          <p className="text-slate-600 dark:text-slate-300 mb-6">
            {error || 'There was an issue processing your payment. Please try again or contact support.'}
          </p>
          <div className="space-y-4">
            <Button onClick={() => router.push('/pricing')}>Return to Pricing</Button>
            <Button variant="outline" onClick={() => window.location.reload()}>
              Try Again
            </Button>
          </div>
        </div>
      </div>
    )
  }

  if (status === 'timeout') {
    return (
      <div className="flex flex-col justify-center items-center min-h-screen space-y-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-yellow-600 mb-4">Payment Still Processing</h1>
          <p className="text-slate-600 dark:text-slate-300 mb-6">
            Your payment is taking longer than expected to process. This is normal and should complete shortly.
          </p>
          <div className="space-y-4">
            <Button onClick={() => window.location.reload()}>Refresh Page</Button>
            <Button variant="outline" onClick={() => router.push('/harada')}>
              Try Accessing App
            </Button>
            <Button variant="outline" onClick={() => router.push('/pricing')}>
              Return to Pricing
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col justify-center items-center min-h-screen space-y-8">
      <Spinner />
      <div className="text-center">
        <h1 className="text-2xl font-bold text-green-600 mb-4">Payment Successful!</h1>
        <p className="text-lg mb-2">Processing your subscription...</p>
        <p className="text-sm text-slate-500">Attempt {retryCount + 1} of 15</p>
        {retryCount > 0 && <p className="text-xs text-slate-400 mt-2">This may take a few moments. Please wait...</p>}
      </div>
    </div>
  )
}

const FallBackContent: React.FC = () => {
  const router = useRouter()
  const { apiClient } = useApiClient()

  async function fetchSubscription() {
    try {
      const response = await apiClient.getSubscription()

      if (response.data?.status === 'active' || response.data?.status === 'trialing') {
        router.push('/harada')
      } else {
        console.log('Subscription not ready yet:', response.errors)
      }
    } catch (error) {
      console.error('Error fetching subscription:', error)
    }
  }

  return (
    <div className="flex flex-col justify-center items-center min-h-screen space-y-8">
      <Spinner />
      <h1 className="text-center w-[240px]">
        Processing your payment. Please wait a few moments if you were sent here from creating a Subscription. Click
        Refresh after a few seconds. If you have any issues, contact us at (336) 624-2373.
      </h1>

      <Button onClick={fetchSubscription}>Refresh</Button>
    </div>
  )
}

export default function SuccessPage() {
  return (
    <Suspense fallback={<FallBackContent />}>
      <SuccessfulContent />
    </Suspense>
  )
}
