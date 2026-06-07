import { AxiosInstance, AxiosRequestConfig } from 'axios'
import type { DogsApi } from './endpoints/dogs'
import { dogsMethods } from './endpoints/dogs'
import type { UploadsApi } from './endpoints/uploads'
import { uploadsMethods } from './endpoints/uploads'
import type { UsersApi } from './endpoints/users'
import { userMethods } from './endpoints/users'
import type { SubscriptionApi } from './endpoints/subscription'
import { subscriptionMethods } from './endpoints/subscription'

export * from './endpoints/users'

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

export interface ApiError extends Error {
  status: number
  statusText: string
}

// eslint-disable-next-line @typescript-eslint/no-unsafe-declaration-merging
class ApiClient {
  private axiosInstance: AxiosInstance | null = null
  private getToken: (() => Promise<string | null>) | null = null

  constructor(axiosInstance?: AxiosInstance) {
    if (axiosInstance) {
      this.axiosInstance = axiosInstance
    }
  }

  setAxiosInstance(axiosInstance: AxiosInstance) {
    this.axiosInstance = axiosInstance
  }

  setGetToken(getToken: () => Promise<string | null>) {
    this.getToken = getToken
  }

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

  async getAuthToken(): Promise<string | null> {
    if (!this.getToken) {
      throw new Error('getToken not configured on API client')
    }
    return this.getToken()
  }

  get baseUrl(): string {
    if (!this.axiosInstance) {
      throw new Error('API client is not ready. Axios instance not initialized.')
    }
    return this.axiosInstance.defaults.baseURL || ''
  }
}

// eslint-disable-next-line @typescript-eslint/no-unsafe-declaration-merging
interface ApiClient extends UsersApi, DogsApi, UploadsApi, SubscriptionApi {}

Object.assign(ApiClient.prototype, userMethods, dogsMethods, uploadsMethods, subscriptionMethods)

export const apiClient = new ApiClient()
export { ApiClient }
