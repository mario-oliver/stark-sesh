import type { ApiClient } from '@/lib/api/api-client'

export const MAX_DOG_PHOTO_BYTES = 10 * 1024 * 1024

const DISPLAYABLE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']

const EXT_TO_TYPE: Record<string, string> = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
  gif: 'image/gif'
}

/** Browsers often leave `file.type` empty; infer from the filename when possible. */
export function inferDogPhotoContentType(file: File): string {
  const fromType = file.type.split(';')[0]?.trim().toLowerCase()
  if (fromType && fromType !== 'application/octet-stream' && DISPLAYABLE_TYPES.includes(fromType)) {
    return fromType
  }
  const ext = file.name.split('.').pop()?.toLowerCase()
  if (ext && EXT_TO_TYPE[ext]) {
    return EXT_TO_TYPE[ext]
  }
  return fromType || ''
}

export function validateDogPhotoFile(file: File): void {
  const type = inferDogPhotoContentType(file)
  if (!type || !DISPLAYABLE_TYPES.includes(type)) {
    throw new Error('Use a JPEG, PNG, WebP, or GIF photo (HEIC from iPhone may not display).')
  }
  if (file.size > MAX_DOG_PHOTO_BYTES) {
    throw new Error(`Photo must be ${MAX_DOG_PHOTO_BYTES / (1024 * 1024)} MB or smaller.`)
  }
}

/**
 * Presigned PUT to S3, then return the object key for createDog.
 */
export async function uploadDogPhotoToS3(
  apiClient: ApiClient,
  file: File
): Promise<{ photoKey: string; viewUrl: string }> {
  validateDogPhotoFile(file)

  const contentType = inferDogPhotoContentType(file)
  const presign = await apiClient.presignDogPhoto({
    contentType,
    contentLength: file.size
  })

  if (!presign.success || !presign.data) {
    throw new Error('Could not start photo upload.')
  }

  const { uploadUrl, photoKey, viewUrl, headers } = presign.data

  try {
    const uploadRes = await fetch(uploadUrl, {
      method: 'PUT',
      body: file,
      headers: { 'Content-Type': headers['Content-Type'] }
    })
    if (!uploadRes.ok) {
      throw new Error(`Photo upload failed (${uploadRes.status}). Check S3 CORS and IAM permissions.`)
    }
  } catch (error) {
    if (error instanceof TypeError) {
      throw new Error(
        'Could not reach S3. Add CORS on your bucket allowing PUT from this site (see api-stark-sesh/docs/S3_DOG_PHOTOS.md).'
      )
    }
    throw error
  }

  return { photoKey, viewUrl }
}
