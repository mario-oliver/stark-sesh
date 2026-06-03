import type { ApiClient } from '../api-client'

export interface PresignDogPhotoInput {
  contentType: string
  contentLength: number
}

export interface PresignDogPhotoResult {
  uploadUrl: string
  photoKey: string
  viewUrl: string
  headers: { 'Content-Type': string }
  expiresIn: number
}

export interface PresignCareStepMediaResult {
  uploadUrl: string
  mediaKey: string
  viewUrl: string
  headers: { 'Content-Type': string }
  expiresIn: number
}

export interface UploadsApi {
  presignDogPhoto(
    input: PresignDogPhotoInput
  ): Promise<{ success: boolean; data: PresignDogPhotoResult }>
  presignCareStepMedia(
    input: PresignDogPhotoInput
  ): Promise<{ success: boolean; data: PresignCareStepMediaResult }>
}

export const uploadsMethods = {
  async presignDogPhoto(this: ApiClient, input: PresignDogPhotoInput) {
    return this.request<{ success: boolean; data: PresignDogPhotoResult }>(
      '/v1/uploads/dog-photo/presign',
      {
        method: 'POST',
        data: input
      }
    )
  },

  async presignCareStepMedia(this: ApiClient, input: PresignDogPhotoInput) {
    return this.request<{ success: boolean; data: PresignCareStepMediaResult }>(
      '/v1/uploads/care-step-media/presign',
      {
        method: 'POST',
        data: input
      }
    )
  }
}
