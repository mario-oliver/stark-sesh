import { AxiosInstance } from 'axios'

export interface SubscriptionInfo {
  stripeCustomerId?: string
  stripeSubscriptionId?: string
  status?: string
  currentPeriodEnd?: number
  currentPeriodStart?: number
  cancelAtPeriodEnd?: boolean
}

export interface CreateCheckoutSessionInput {
  priceId: string
  isTrial?: boolean
}

export interface SyncSubscriptionInput {
  stripeCustomerId: string
  userId: string
}

export const subscriptionsMethods = {
  async getSubscription(this: { axiosInstance: AxiosInstance }) {
    return this.axiosInstance.get<{
      success: boolean
      data: SubscriptionInfo | null
    }>('/v1/subscriptions')
  },
  async createCheckoutSession(this: { axiosInstance: AxiosInstance }, input: CreateCheckoutSessionInput) {
    return this.axiosInstance.post<{
      url: string
      sessionId: string
    }>('/v1/stripe/checkout-sessions', input)
  },
  async syncSubscription(this: { axiosInstance: AxiosInstance }, input: SyncSubscriptionInput) {
    return this.axiosInstance.post<{ success: boolean; data: SubscriptionInfo }>('/v1/subscriptions/sync', input)
  }
}
