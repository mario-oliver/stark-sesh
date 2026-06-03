'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { DogPhoto } from '@/components/dog/DogPhoto'
import { DogSubNav } from '@/components/dog/DogSubNav'
import { Button } from '@/components/ui/button'
import { useApiClient } from '@/hooks/use-api-client'
import type { DogRecord } from '@/lib/api/endpoints/dogs'
import { formatShareCode } from '@/lib/share-code'

export function ProfileClient({ dogId }: { dogId: string }) {
  const { apiClient, isReady } = useApiClient()
  const [dog, setDog] = useState<DogRecord | null>(null)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (!isReady) return
    void apiClient.getDog(dogId).then(res => setDog(res.data))
  }, [apiClient, isReady, dogId])

  const handleCopy = async () => {
    if (!dog?.shareCode) return
    const formatted = formatShareCode(dog.shareCode)
    await navigator.clipboard.writeText(formatted)
    setCopied(true)
    window.setTimeout(() => setCopied(false), 2000)
  }

  if (!dog) {
    return (
      <div className="min-h-screen bg-[#0c0c0c] text-zinc-500 flex items-center justify-center">
        Loading…
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0c0c0c] text-zinc-100 max-w-lg mx-auto px-4 py-8">
      <Link href="/today" className="text-sm text-amber-400 underline">
        ← Home
      </Link>
      <DogSubNav dogId={dogId} />
      <div className="mt-6">
        <DogPhoto dogId={dog.id} photoUrl={dog.photoUrl} name={dog.name} size="xl" />
      </div>
      <h1 className="text-2xl font-semibold mt-4">{dog.name}</h1>
      {dog.breed && <p className="text-zinc-400 mt-2">Breed: {dog.breed}</p>}
      {dog.age != null && <p className="text-zinc-400">Age: {dog.age}</p>}
      {dog.notes && <p className="text-zinc-400 mt-4">{dog.notes}</p>}

      {dog.shareCode && (
        <section className="mt-8 border border-zinc-800 rounded-lg p-4">
          <h2 className="text-sm font-medium text-zinc-200">Invite a caregiver</h2>
          <p className="text-sm text-zinc-500 mt-1">
            Share this code with someone so they can join {dog.name}&apos;s care log.
          </p>
          <div className="mt-4 flex items-center gap-3">
            <code className="flex-1 text-lg tracking-widest text-amber-400 font-mono bg-zinc-900 px-3 py-2 rounded">
              {formatShareCode(dog.shareCode)}
            </code>
            <Button type="button" variant="outline" onClick={() => void handleCopy()}>
              {copied ? 'Copied' : 'Copy'}
            </Button>
          </div>
        </section>
      )}
    </div>
  )
}
