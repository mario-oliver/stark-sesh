'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuth } from '@clerk/nextjs'
import { useEffect, useState } from 'react'
import { DogPhoto } from '@/components/dog/DogPhoto'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useApiClient } from '@/hooks/use-api-client'
import type { JoinPreview } from '@/lib/api/endpoints/dogs'
import { normalizeShareCode } from '@/lib/share-code'

type Step = 'enter' | 'confirm'

export default function JoinPage() {
  const router = useRouter()
  const { isLoaded, isSignedIn } = useAuth()
  const { apiClient, isReady } = useApiClient()

  const [step, setStep] = useState<Step>('enter')
  const [code, setCode] = useState('')
  const [preview, setPreview] = useState<JoinPreview | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (!isLoaded) return
    if (!isSignedIn) {
      router.replace('/sign-in?redirect_url=/join')
    }
  }, [isLoaded, isSignedIn, router])

  const handlePreview = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isReady) return
    const normalized = normalizeShareCode(code)
    if (!normalized) {
      setError('Enter a share code.')
      return
    }

    setBusy(true)
    setError(null)
    try {
      const res = await apiClient.previewJoin(normalized)
      setPreview(res.data)
      setStep('confirm')
    } catch {
      setError('Code not found. Check the code and try again.')
    } finally {
      setBusy(false)
    }
  }

  const handleJoin = async () => {
    if (!isReady || !preview) return
    setBusy(true)
    setError(null)
    try {
      const res = await apiClient.joinByShareCode(normalizeShareCode(code))
      router.replace(`/dogs/${res.data.id}/today`)
    } catch {
      setError('Could not join this care log. Try again.')
      setBusy(false)
    }
  }

  if (!isLoaded || !isSignedIn) {
    return (
      <div className="min-h-screen bg-[#0c0c0c] flex items-center justify-center text-zinc-500">
        Loading…
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0c0c0c] text-zinc-100">
      <div className="max-w-lg mx-auto px-4 py-10">
        <Link href="/today" className="text-sm text-amber-400 underline">
          ← Back
        </Link>

        <p className="text-xs uppercase tracking-widest text-zinc-500 mt-6">Join a care log</p>
        <h1 className="text-2xl font-semibold mt-2">
          {step === 'enter' ? 'Enter share code' : 'Confirm join'}
        </h1>
        <p className="text-zinc-400 text-sm mt-2">
          {step === 'enter'
            ? 'Ask the dog owner for their share code to join as a caregiver.'
            : 'You will be added as a caregiver with full access to this care log.'}
        </p>

        {error && <p className="text-red-400 text-sm mt-4">{error}</p>}

        {step === 'enter' && (
          <form className="mt-8 space-y-6" onSubmit={e => void handlePreview(e)}>
            <div className="space-y-2">
              <Label htmlFor="share-code" className="text-zinc-300">
                Share code
              </Label>
              <Input
                id="share-code"
                value={code}
                onChange={e => setCode(e.target.value.toUpperCase())}
                placeholder="XXXX-XXXX"
                className="bg-zinc-900 border-zinc-700 text-zinc-100 font-mono tracking-widest uppercase"
                autoFocus
                autoComplete="off"
                spellCheck={false}
              />
            </div>
            <Button
              type="submit"
              disabled={busy || !isReady}
              className="w-full bg-amber-600 hover:bg-amber-500 text-black"
            >
              {busy ? 'Looking up…' : 'Continue'}
            </Button>
          </form>
        )}

        {step === 'confirm' && preview && (
          <div className="mt-8">
            <div className="flex flex-col items-center gap-4 p-6 rounded-lg border border-zinc-800 bg-zinc-900/40">
              <DogPhoto
                dogId={preview.id}
                photoUrl={preview.photoUrl}
                name={preview.name}
                size="lg"
              />
              <div className="text-center">
                <p className="text-xl font-medium">{preview.name}</p>
                {preview.breed && <p className="text-sm text-zinc-500 mt-1">{preview.breed}</p>}
              </div>
            </div>

            <div className="flex gap-3 mt-8">
              <Button
                type="button"
                variant="outline"
                className="flex-1 border-zinc-700 text-zinc-300"
                disabled={busy}
                onClick={() => {
                  setStep('enter')
                  setPreview(null)
                  setError(null)
                }}
              >
                Back
              </Button>
              <Button
                type="button"
                className="flex-1 bg-amber-600 hover:bg-amber-500 text-black"
                disabled={busy || !isReady}
                onClick={() => void handleJoin()}
              >
                {busy ? 'Joining…' : 'Join care log'}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
