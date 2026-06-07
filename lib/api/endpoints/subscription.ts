import type { ApiResponse } from '../api-client'
import { AxiosInstance } from 'axios'

export interface EntitlementResult {
  planSlug: string | null
  hasPro: boolean
  hasBasic: boolean
  source: 'stripe' | 'apple' | null
  status: string | null
  periodEnd: string | null
  cancelAtPeriodEnd: boolean
}

export interface SubscriptionRecord {
  id: string
  status: string
  planSlug: string
  source: 'stripe' | 'apple'
  periodEnd: string | null
  cancelAtPeriodEnd: boolean
}

export interface SubscriptionPayload {
  entitlement: EntitlementResult
  subscriptions: SubscriptionRecord[]
}

export interface CheckoutPayload {
  url: string
  sessionId: string
}

export interface PortalPayload {
  url: string
}

export interface SubscriptionApi {
  getSubscription(): Promise<ApiResponse<SubscriptionPayload>>
  createCheckoutSession(input: { priceId: string }): Promise<ApiResponse<CheckoutPayload>>
  syncStripeSubscription(): Promise<ApiResponse<{ synced: boolean }>>
  createPortalSession(): Promise<ApiResponse<PortalPayload>>
}

export const subscriptionMethods = {
  async getSubscription(this: { axiosInstance: AxiosInstance }) {
    return await this.axiosInstance.get('/v1/subscription')
  },

  async createCheckoutSession(this: { axiosInstance: AxiosInstance }, input: { priceId: string }) {
    return await this.axiosInstance.post('/v1/stripe/checkout', input)
  },

  async syncStripeSubscription(this: { axiosInstance: AxiosInstance }) {
    return await this.axiosInstance.post('/v1/stripe/sync')
  },

  async createPortalSession(this: { axiosInstance: AxiosInstance }) {
    return await this.axiosInstance.post('/v1/stripe/portal')
  }
}
