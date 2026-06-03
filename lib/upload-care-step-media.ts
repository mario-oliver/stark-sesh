import type { ApiClient } from '@/lib/api/api-client'

export const MAX_CARE_STEP_IMAGE_BYTES = 10 * 1024 * 1024
export const MAX_CARE_STEP_VIDEO_BYTES = 25 * 1024 * 1024

const IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
const VIDEO_TYPES = ['video/mp4', 'video/webm', 'video/quicktime']

export function inferCareStepContentType(file: File): string {
  const fromType = file.type.split(';')[0]?.trim().toLowerCase()
  if (fromType) return fromType
  const ext = file.name.split('.').pop()?.toLowerCase()
  const map: Record<string, string> = {
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    png: 'image/png',
    webp: 'image/webp',
    gif: 'image/gif',
    mp4: 'video/mp4',
    webm: 'video/webm',
    mov: 'video/quicktime'
  }
  return ext && map[ext] ? map[ext] : ''
}

export function validateCareStepMediaFile(file: File): { contentType: string; isVideo: boolean } {
  const contentType = inferCareStepContentType(file)
  const isVideo = VIDEO_TYPES.includes(contentType)
  const isImage = IMAGE_TYPES.includes(contentType)
  if (!isVideo && !isImage) {
    throw new Error('Use JPEG, PNG, WebP, GIF, MP4, WebM, or MOV.')
  }
  const max = isVideo ? MAX_CARE_STEP_VIDEO_BYTES : MAX_CARE_STEP_IMAGE_BYTES
  if (file.size > max) {
    throw new Error(`File must be ${max / (1024 * 1024)} MB or smaller.`)
  }
  return { contentType, isVideo }
}

export async function uploadCareStepMediaToS3(
  apiClient: ApiClient,
  file: File
): Promise<{ mediaKey: string; mediaContentType: string; viewUrl: string }> {
  const { contentType } = validateCareStepMediaFile(file)

  const presign = await apiClient.presignCareStepMedia({
    contentType,
    contentLength: file.size
  })

  if (!presign.success || !presign.data) {
    throw new Error('Could not start media upload.')
  }

  const { uploadUrl, mediaKey, viewUrl, headers } = presign.data

  const uploadRes = await fetch(uploadUrl, {
    method: 'PUT',
    body: file,
    headers: { 'Content-Type': headers['Content-Type'] }
  })
  if (!uploadRes.ok) {
    throw new Error(`Upload failed (${uploadRes.status}).`)
  }

  return { mediaKey, mediaContentType: contentType, viewUrl }
}
