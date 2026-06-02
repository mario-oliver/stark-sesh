import axios from 'axios'
import { useAuth } from '@clerk/nextjs'
import { useEffect, useMemo } from 'react'
import { ApiClient } from '@/lib/api/api-client'

export const useAxiosApiClient = () => {
  const { getToken, isLoaded, isSignedIn } = useAuth()

  // Validate environment variable
  const baseURL = process.env.NEXT_PUBLIC_API_URL
  if (!baseURL) {
    throw new Error(
      'NEXT_PUBLIC_API_URL environment variable is not defined. Please check your environment configuration.'
    )
  }

  const isReady = isLoaded && isSignedIn

  const axiosInstance = useMemo(() => {
    const instance = axios.create({
      baseURL,
      // timeout: 30000, // 30 second timeout
      headers: {
        'Content-Type': 'application/json'
      }
    })

    // Request interceptor to add auth token
    instance.interceptors.request.use(
      async config => {
        // Don't set Content-Type for FormData - let axios handle it
        if (config.data instanceof FormData) {
          delete config.headers['Content-Type']
        }

        // Add auth token if available - getToken is called fresh each time
        try {
          const token = await getToken()
          if (token) {
            config.headers.Authorization = `Bearer ${token}`
          }
        } catch (error) {
          console.warn('Failed to get auth token:', error)
        }

        return config
      },
      error => {
        return Promise.reject(error)
      }
    )

    // Response interceptor for error handling
    instance.interceptors.response.use(
      response => {
        // Return the data directly, maintaining the same interface as before
        return {
          ...response.data,
          response: response
        }
      },
      error => {
        console.error('API request failed:', error)

        // Handle JWT expiration errors
        if (error.response?.status === 401) {
          const authReason = error.response.headers['x-clerk-auth-reason']
          const authMessage = error.response.headers['x-clerk-auth-message']

          if (authReason === 'token-expired' || authMessage?.includes('JWT is expired')) {
            const apiError = new Error('Authentication token expired. Please refresh the page.') as Error & {
              status: number
              statusText: string
            }
            apiError.status = error.response.status
            apiError.statusText = error.response.statusText
            throw apiError
          }
        }

        // Create consistent error format, preserving response data
        const apiError = new Error(
          error.response?.data?.message || error.message || `HTTP error! status: ${error.response?.status || 'unknown'}`
        ) as Error & { status: number; statusText: string; response?: unknown }
        apiError.status = error.response?.status || 0
        apiError.statusText = error.response?.statusText || 'Unknown error'
        apiError.response = error.response // Preserve the full response including data

        throw apiError
      }
    )

    return instance
    // getToken is used in the interceptor closure but we intentionally don't include it in deps
    // because we want to call the latest getToken function, but not recreate the axios instance
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [baseURL]) // Removed getToken from dependencies

  return { axiosInstance, isReady }
}

// New hook that combines axios with ApiClient
// apiClient is stable (only recreated when axiosInstance changes) to avoid
// useEffects that depend on apiClient from re-running every render (getToken
// gets a new reference each time from Clerk and would otherwise cause a loop).
export const useApiClient = () => {
  const { axiosInstance, isReady } = useAxiosApiClient()
  const { getToken } = useAuth()

  const apiClient = useMemo(() => {
    const client = new ApiClient()
    client.setAxiosInstance(axiosInstance)
    return client
  }, [axiosInstance])

  useEffect(() => {
    apiClient.setGetToken(getToken)
  }, [apiClient, getToken])

  return { apiClient, isReady }
}
