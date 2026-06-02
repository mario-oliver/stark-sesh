import type { ApiResponse, PaginatedResponse } from '../api-client'
import { AxiosInstance } from 'axios'

/**
 * User API
 */

export interface User {
  id: string
  email: string
  firstName?: string
  lastName?: string
  createdAt: string
  updatedAt: string
}

export interface CreateUserInput {
  id: string
  email: string
  firstName?: string
  lastName?: string
}

export interface UpdateUserInput {
  firstName?: string
  lastName?: string
  email?: string
}

export interface UserListQuery {
  page?: number
  limit?: number
  search?: string
}

/** Method signatures for User API; merged onto ApiClient. */
export interface UsersApi {
  createUser(data: CreateUserInput): Promise<ApiResponse<User>>
  getProfile(): Promise<ApiResponse<User>>
  updateProfile(data: UpdateUserInput): Promise<ApiResponse<User>>
  getUsers(query?: UserListQuery): Promise<PaginatedResponse<User[]>>
  getUser(id: string): Promise<ApiResponse<User>>
  updateUser(id: string, data: UpdateUserInput): Promise<ApiResponse<User>>
}

export const userMethods = {
  async createUser(this: { axiosInstance: AxiosInstance }, input: CreateUserInput) {
    return await this.axiosInstance.post('/v1/users', input)
  },

  async getProfile(this: { axiosInstance: AxiosInstance }) {
    return await this.axiosInstance.get('/v1/users/me')
  },

  async updateProfile(this: { axiosInstance: AxiosInstance }, input: UpdateUserInput) {
    return await this.axiosInstance.patch('/v1/users/me', input)
  },

  async getUsers(this: { axiosInstance: AxiosInstance }, query?: UserListQuery) {
    return await this.axiosInstance.get('/v1/users', { params: query })
  },

  async getUser(this: { axiosInstance: AxiosInstance }, id: string) {
    return await this.axiosInstance.get(`/v1/users/${id}`)
  },

  async updateUser(this: { axiosInstance: AxiosInstance }, id: string, input: UpdateUserInput) {
    return await this.axiosInstance.patch(`/v1/users/${id}`, input)
  }
}

// Export types
export type {
  User as UserType,
  CreateUserInput as CreateUserInputType,
  UpdateUserInput as UpdateUserInputType
}

