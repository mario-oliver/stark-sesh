'use client'

import { DogPhoto } from '@/components/dog/DogPhoto'
import { cn } from '@/lib/utils'

type DogHeroProps = {
  dogId: string
  photoUrl: string | null | undefined
  name: string
  /** When set (e.g. edit preview), shown instead of photoUrl */
  displayPhotoUrl?: string | null
  onPhotoClick?: () => void
  photoUploading?: boolean
  className?: string
}

export function DogHero({
  dogId,
  photoUrl,
  name,
  displayPhotoUrl,
  onPhotoClick,
  photoUploading = false,
  className
}: DogHeroProps) {
  const resolvedPhoto = displayPhotoUrl ?? photoUrl
  const editable = Boolean(onPhotoClick)

  const photo = (
    <DogPhoto
      dogId={dogId}
      photoUrl={resolvedPhoto}
      name={name}
      size="hero"
      className={cn('w-full shadow-xl ring-2 ring-primary/20', editable && 'transition-opacity group-hover:opacity-90')}
    />
  )

  return (
    <div className={cn('relative w-full max-w-md mx-auto', className)}>
      {editable ? (
        <button
          type="button"
          onClick={onPhotoClick}
          disabled={photoUploading}
          className="group relative block w-full cursor-pointer disabled:cursor-wait text-left"
          aria-label="Change photo"
        >
          {photo}
          <div className="absolute inset-x-0 bottom-0 rounded-b-4xl bg-gradient-to-t from-foreground/85 via-foreground/40 to-transparent pt-24 pb-6 px-4 text-center pointer-events-none">
            <p className="text-3xl sm:text-4xl font-bold text-background tracking-tight drop-shadow-md">
              {name}
            </p>
            <p className="text-xs text-background/80 mt-2">
              {photoUploading ? 'Uploading…' : 'Tap to change photo'}
            </p>
          </div>
        </button>
      ) : (
        <>
          {photo}
          <div className="absolute inset-x-0 bottom-0 rounded-b-4xl bg-gradient-to-t from-foreground/85 via-foreground/40 to-transparent pt-24 pb-6 px-4 text-center pointer-events-none">
            <h1 className="text-3xl sm:text-4xl font-bold text-background tracking-tight drop-shadow-md">
              {name}
            </h1>
          </div>
        </>
      )}
    </div>
  )
}
