'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useApiClient } from '@/hooks/use-api-client'
import type { DogRecord } from '@/lib/api/endpoints/dogs'

export function ProfileClient({ dogId }: { dogId: string }) {
  const { apiClient, isReady } = useApiClient()
  const [dog, setDog] = useState<DogRecord | null>(null)

  useEffect(() => {
    if (!isReady) return
    void apiClient.getDog(dogId).then(res => setDog(res.data))
  }, [apiClient, isReady, dogId])

  if (!dog) {
    return (
      <div className="min-h-screen bg-[#0c0c0c] text-zinc-500 flex items-center justify-center">
        Loading…
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0c0c0c] text-zinc-100 max-w-lg mx-auto px-4 py-8">
      <Link href={`/dogs/${dogId}/today`} className="text-sm text-amber-400 underline">
        ← Today
      </Link>
      {dog.photoUrl && (
        <div className="mt-6 relative size-24 rounded-full overflow-hidden border border-zinc-800">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={dog.photoUrl} alt="" className="size-full object-cover" />
        </div>
      )}
      <h1 className="text-2xl font-semibold mt-4">{dog.name}</h1>
      {dog.breed && <p className="text-zinc-400 mt-2">Breed: {dog.breed}</p>}
      {dog.age != null && <p className="text-zinc-400">Age: {dog.age}</p>}
      {dog.notes && <p className="text-zinc-400 mt-4">{dog.notes}</p>}
    </div>
  )
}
