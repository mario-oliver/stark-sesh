import { useApiClient } from '@/hooks/use-api-client'
import { useUser } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

export interface PaymentFlowOptions {
  priceId: string
  isTrial?: boolean
}

export const usePaymentFlow = () => {
  const { isLoaded, isSignedIn } = useUser()
  const router = useRouter()
  const { apiClient } = useApiClient()

  const handlePaymentFlow = async ({ priceId, isTrial = false }: PaymentFlowOptions) => {
    // If auth is still loading, wait
    if (!isLoaded) {
      return
    }

    // If user is not signed in, redirect to sign-in with return URL
    if (!isSignedIn) {
      const returnUrl = encodeURIComponent('/pricing?redirect=payment')
      router.push(`/sign-in?redirect_url=${returnUrl}`)
      return
    }

    // Check subscription status
    try {
      const response = await apiClient.getSubscription()

      // If user has active subscription, redirect to main app
      if ((response.success && response.data?.status === 'active') || response.data?.status === 'trialing') {
        router.push('/harada')
        return
      }

      // If no subscription or inactive, proceed with payment
      await processPayment(priceId, isTrial)
    } catch (error) {
      console.error('Error checking subscription:', error)
      toast.error('Unable to check subscription status. Please try again.')
    }
  }

  const processPayment = async (priceId: string, isTrial: boolean) => {
    try {
      const res = await apiClient.createCheckoutSession({ priceId, isTrial })

      if (!res.success) {
        console.error(res.errors)
        toast.error('Payment Error. Unable to create payment session. Please try again.')
        return
      }

      const { url, sessionId } = res.data
      if (url && sessionId) {
        window.location.href = url
      } else {
        console.error('Stripe session URL not received')
        toast.error('Payment Error. Unable to redirect to payment. Please try again.')
      }
    } catch (error) {
      console.error('Error processing payment:', error)
      toast.error('Payment Error. Unable to process payment. Please try again.')
    }
  }

  return {
    handlePaymentFlow
  }
}
