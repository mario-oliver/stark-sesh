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

export interface UploadsApi {
  presignDogPhoto(
    input: PresignDogPhotoInput
  ): Promise<{ success: boolean; data: PresignDogPhotoResult }>
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
  }
}
