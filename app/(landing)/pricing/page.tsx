'use client'

import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useUser } from '@clerk/nextjs'
// import PricingCards from '@/components/pricing'
import { useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
import { useApiClient } from '@/hooks/use-api-client'

const PricingPageContent = () => {
  const { isLoaded, isSignedIn } = useUser()
  const { apiClient } = useApiClient()
  const router = useRouter()
  const searchParams = useSearchParams()
  const priceCardRef = useRef<HTMLDivElement>(null)
  const redirectParam = searchParams.get('redirect')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Wait for auth to load
    if (!isLoaded) return

    // If user is not signed in, redirect to sign-in
    if (!isSignedIn) {
      const returnUrl = encodeURIComponent('/pricing?redirect=payment')
      router.push(`/sign-in?redirect_url=${returnUrl}`)
      return
    }

    // If user is signed in, check subscription status
    const checkSubscriptionAndRedirect = async () => {
      try {
        const response = await apiClient.getSubscription()

        // If user has active subscription, redirect to main app
        if ((response.success && response.data?.status === 'active') || response.data?.status === 'trialing') {
          router.push('/harada')
          return
        }

        // No subscription or inactive - show pricing page (expected for new users)
        // If redirect param is 'payment', scroll to pricing cards
        if (redirectParam === 'payment') {
          setTimeout(() => {
            priceCardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
          }, 500)
        }

        // Clean up URL parameters to prevent unwanted toasts
        const url = new URL(window.location.href)
        if (url.searchParams.has('canceled') || url.searchParams.has('success')) {
          url.searchParams.delete('canceled')
          url.searchParams.delete('success')
          window.history.replaceState({}, '', url.toString())
        }
      } catch (error: unknown) {
        // Handle unexpected errors only
        console.error('Error checking subscription:', error)
        setError('Failed to check subscription status. Please refresh the page and try again.')
      }
    }

    checkSubscriptionAndRedirect()
  }, [apiClient, isLoaded, isSignedIn, router, redirectParam])

  // Show loading while auth is loading
  if (!isLoaded) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
          <p className="mt-4 text-slate-600 dark:text-slate-300">Loading...</p>
        </div>
      </div>
    )
  }

  // Show error state
  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="text-red-600 mb-4">
            <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
              />
            </svg>
          </div>
          <h1 className="text-xl font-bold text-red-600 mb-2">Error</h1>
          <p className="text-slate-600 dark:text-slate-300 mb-6">{error}</p>
          <div className="space-y-3">
            <Button onClick={() => window.location.reload()} className="w-full">
              Try Again
            </Button>
            <Button variant="outline" onClick={() => router.push('/')} className="w-full">
              Return Home
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <main className="flex flex-col min-h-screen overflow-x-hidden justify-center items-center">
      <div className="w-full py-20">
        <div className="w-[90%] md:w-[80%] lg:w-[60%] mx-auto text-center space-y-8">
          <h1 className="text-shadow-lg font-bold text-3xl md:text-5xl text-primary">
            Choose Your Transformation Plan
          </h1>
          <p className="text-lg md:text-xl text-slate-600 dark:text-slate-300 max-w-2xl mx-auto">
            Start your journey to a more fulfilled life with our personalized transformation experience.
          </p>
        </div>

        {/* <div ref={priceCardRef}>
          <PricingCards setRef={priceCardRef} />
        </div> */}
      </div>
    </main>
  )
}

export default function PricingPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <div className="text-center">
            <Spinner />
            <p className="mt-4 text-slate-600 dark:text-slate-300">Loading pricing...</p>
          </div>
        </div>
      }
    >
      <PricingPageContent />
    </Suspense>
  )
}
