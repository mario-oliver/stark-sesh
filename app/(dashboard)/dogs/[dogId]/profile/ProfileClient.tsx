'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { DogPhoto } from '@/components/dog/DogPhoto'
import { Button } from '@/components/ui/button'
import { useApiClient } from '@/hooks/use-api-client'
import { useActiveDog } from '@/hooks/use-active-dog'
import type { DogRecord } from '@/lib/api/endpoints/dogs'
import { formatShareCode } from '@/lib/share-code'

export function ProfileClient({ dogId }: { dogId: string }) {
  const { apiClient, isReady } = useApiClient()
  useActiveDog(dogId)
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
      <div className="min-h-screen bg-background text-muted-foreground flex items-center justify-center">
        Loading…
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background text-foreground max-w-lg mx-auto px-4 py-8">
      <Link href="/today" className="text-sm text-primary underline">
        ← Care
      </Link>
      <div className="mt-6">
        <DogPhoto dogId={dog.id} photoUrl={dog.photoUrl} name={dog.name} size="xl" />
      </div>
      <h1 className="text-2xl font-semibold mt-4">{dog.name}</h1>
      {dog.breed && <p className="text-muted-foreground mt-2">Breed: {dog.breed}</p>}
      {dog.age != null && <p className="text-muted-foreground">Age: {dog.age}</p>}
      {dog.notes && <p className="text-muted-foreground mt-4">{dog.notes}</p>}

      {dog.shareCode && (
        <section className="mt-8 border border-border rounded-lg p-4">
          <h2 className="text-sm font-medium text-foreground">Invite a caregiver</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Share this code with someone so they can join {dog.name}&apos;s care log.
          </p>
          <div className="mt-4 flex items-center gap-3">
            <code className="flex-1 text-lg tracking-widest text-primary font-mono bg-muted px-3 py-2 rounded">
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
