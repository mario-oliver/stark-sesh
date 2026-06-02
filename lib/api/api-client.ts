import { AxiosInstance, AxiosRequestConfig } from 'axios'
import type { SessionsApi } from './endpoints/sessions'
import { sessionsMethods } from './endpoints/sessions'
import type {
  SubscriptionsApi
} from './endpoints/subscriptions'
import { subscriptionsMethods } from './endpoints/subscriptions'
import type { TeamsApi } from './endpoints/teams'
import { teamsMethods } from './endpoints/teams'
import type { UsersApi } from './endpoints/users'
import { userMethods } from './endpoints/users'

// Re-export types from sub-modules
export * from './endpoints/users'
export type { SubscriptionInfo } from './endpoints/subscriptions'

// Common API types
export interface PaginationInfo {
  page: number
  limit: number
  total: number
  pages: number
}

export interface ApiResponse<T> {
  success: boolean
  data: T
  message?: string
  errors?: unknown
  response?: unknown
  code?: string
}

export interface PaginatedResponse<T> extends ApiResponse<T> {
  pagination: PaginationInfo
}

// Custom API error type
export interface ApiError extends Error {
  status: number
  statusText: string
}

// Generic API client using axios
// eslint-disable-next-line @typescript-eslint/no-unsafe-declaration-merging
class ApiClient {
  private axiosInstance: AxiosInstance | null = null
  private getToken: (() => Promise<string | null>) | null = null

  constructor(axiosInstance?: AxiosInstance) {
    if (axiosInstance) {
      this.axiosInstance = axiosInstance
    }
  }

  // Method to set the axios instance (called from the hook)
  setAxiosInstance(axiosInstance: AxiosInstance) {
    this.axiosInstance = axiosInstance
  }

  // Method to set the getToken function (for streaming endpoints that need fetch)
  setGetToken(getToken: () => Promise<string | null>) {
    this.getToken = getToken
  }

  // Main request method using axios (protected so it can be used by api methods)
  protected async request<T>(endpoint: string, options: AxiosRequestConfig = {}): Promise<T> {
    if (!this.axiosInstance) {
      throw new Error('API client is not ready. Axios instance not initialized.')
    }

    const response = await this.axiosInstance.request<T>({
      url: endpoint,
      ...options
    })
    return response as T
  }

  // Helper method to get auth token (for streaming/fetch requests)
  async getAuthToken(): Promise<string | null> {
    if (!this.getToken) {
      throw new Error('getToken not configured on API client')
    }
    return this.getToken()
  }

  // Helper method to get base URL
  get baseUrl(): string {
    if (!this.axiosInstance) {
      throw new Error('API client is not ready. Axios instance not initialized.')
    }
    return this.axiosInstance.defaults.baseURL || ''
  }
}

// TypeScript: merge endpoint method signatures onto ApiClient (so apiClient.getSession etc. are typed).
// Runtime: attach the actual implementations from each endpoint module.
// eslint-disable-next-line @typescript-eslint/no-unsafe-declaration-merging
interface ApiClient extends SubscriptionsApi, UsersApi, TeamsApi, SessionsApi {}

Object.assign(ApiClient.prototype, subscriptionsMethods, userMethods, teamsMethods, sessionsMethods)

export const apiClient = new ApiClient()
export { ApiClient }
