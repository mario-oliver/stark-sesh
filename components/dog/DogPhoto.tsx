'use client'

import { useEffect, useRef, useState } from 'react'
import { useApiClient } from '@/hooks/use-api-client'
import { DEFAULT_DOG_PHOTO_URL } from '@/lib/default-dog-photo'
import { cn } from '@/lib/utils'

type Size = 'md' | 'lg' | 'xl' | 'hero'

const sizeClasses: Record<Size, string> = {
  md: 'size-16',
  lg: 'size-24',
  xl: 'size-32',
  hero: 'w-full aspect-[4/5] max-h-[min(72vh,420px)]'
}

type Props = {
  dogId: string
  photoUrl: string | null | undefined
  name: string
  size?: Size
  className?: string
}

/**
 * Presigned S3 URLs can fail in <img> when the browser sends a Referer header.
 * `referrerPolicy="no-referrer"` avoids that; on error we fetch a fresh signed URL.
 */
export function DogPhoto({ dogId, photoUrl, name, size = 'lg', className }: Props) {
  const { apiClient, isReady } = useApiClient()
  const [src, setSrc] = useState(photoUrl ?? null)
  const [failed, setFailed] = useState(false)
  const retriedRef = useRef(false)

  useEffect(() => {
    setSrc(photoUrl ?? null)
    setFailed(false)
    retriedRef.current = false
  }, [photoUrl])

  const refreshUrl = async () => {
    if (!isReady || retriedRef.current) {
      setFailed(true)
      return
    }
    retriedRef.current = true
    try {
      const res = await apiClient.getDog(dogId)
      if (res.data.photoUrl) {
        setSrc(res.data.photoUrl)
        setFailed(false)
      } else {
        setFailed(true)
      }
    } catch {
      setFailed(true)
    }
  }

  const fallbackSrc = DEFAULT_DOG_PHOTO_URL

  const isHero = size === 'hero'
  const shapeClass = isHero ? 'rounded-4xl' : 'rounded-full'

  if (!src || failed) {
    return (
      <div
        className={cn(
          sizeClasses[size],
          shapeClass,
          'overflow-hidden border border-border shrink-0 bg-muted',
          className
        )}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={fallbackSrc} alt={`${name} profile`} className="size-full object-cover" />
      </div>
    )
  }

  return (
    <div
      className={cn(sizeClasses[size], shapeClass, 'overflow-hidden border border-border shrink-0 bg-muted', className)}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={`${name} profile`}
        className="size-full object-cover"
        referrerPolicy="no-referrer"
        onError={() => {
          void refreshUrl()
        }}
      />
    </div>
  )
}
