'use client'

import { DogPhoto } from '@/components/dog/DogPhoto'

type DogHeroProps = {
  dogId: string
  photoUrl: string | null | undefined
  name: string
}

export function DogHero({ dogId, photoUrl, name }: DogHeroProps) {
  return (
    <div className="relative w-full max-w-md mx-auto">
      <DogPhoto
        dogId={dogId}
        photoUrl={photoUrl}
        name={name}
        size="hero"
        className="w-full shadow-xl ring-2 ring-primary/20"
      />
      <div className="absolute inset-x-0 bottom-0 rounded-b-2xl bg-gradient-to-t from-foreground/85 via-foreground/40 to-transparent pt-24 pb-6 px-4 text-center pointer-events-none">
        <h1 className="text-3xl sm:text-4xl font-bold text-background tracking-tight drop-shadow-md">
          {name}
        </h1>
      </div>
    </div>
  )
}
