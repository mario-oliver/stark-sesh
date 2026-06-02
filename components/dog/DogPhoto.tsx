'use client'

import { useEffect, useRef, useState } from 'react'
import { useApiClient } from '@/hooks/use-api-client'
import { cn } from '@/lib/utils'

type Size = 'md' | 'lg' | 'xl'

const sizeClasses: Record<Size, string> = {
  md: 'size-16',
  lg: 'size-24',
  xl: 'size-32'
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

  if (!src || failed) {
    return (
      <div
        className={cn(
          sizeClasses[size],
          'rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center shrink-0 text-zinc-400 font-semibold',
          className
        )}
        aria-hidden
      >
        {name.trim().charAt(0).toUpperCase() || '?'}
      </div>
    )
  }

  return (
    <div
      className={cn(
        sizeClasses[size],
        'rounded-full overflow-hidden border border-zinc-700 shrink-0 bg-zinc-900',
        className
      )}
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
