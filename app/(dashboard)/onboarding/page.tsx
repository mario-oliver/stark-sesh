'use client'

import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useAuth } from '@clerk/nextjs'
import { useEffect, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useApiClient } from '@/hooks/use-api-client'
import { DEFAULT_ROUTINE_ITEMS, DEFAULT_ROUTINE_NAME } from '@/lib/care/default-routine'

const MAX_PHOTO_BYTES = 2 * 1024 * 1024

async function readPhotoAsDataUrl(file: File): Promise<string> {
  if (!file.type.startsWith('image/')) {
    throw new Error('Please choose an image file.')
  }
  if (file.size > MAX_PHOTO_BYTES) {
    throw new Error('Photo must be 2 MB or smaller.')
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result)
      } else {
        reject(new Error('Could not read photo.'))
      }
    }
    reader.onerror = () => reject(new Error('Could not read photo.'))
    reader.readAsDataURL(file)
  })
}

export default function OnboardingPage() {
  const router = useRouter()
  const { isLoaded, isSignedIn } = useAuth()
  const { apiClient, isReady } = useApiClient()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [step, setStep] = useState<1 | 2>(1)
  const [name, setName] = useState('')
  const [breed, setBreed] = useState('')
  const [age, setAge] = useState('')
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const [photoUrl, setPhotoUrl] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [checkingExisting, setCheckingExisting] = useState(true)

  useEffect(() => {
    if (!isLoaded) return
    if (!isSignedIn) {
      router.replace('/sign-in?redirect_url=/onboarding')
      return
    }
    if (!isReady) return

    void (async () => {
      try {
        const res = await apiClient.listDogs()
        if (res.data.length > 0) {
          router.replace(`/dogs/${res.data[0].id}/today`)
          return
        }
      } catch {
        setError('Could not load your account. Try again.')
      } finally {
        setCheckingExisting(false)
      }
    })()
  }, [apiClient, isLoaded, isReady, isSignedIn, router])

  const handlePhotoChange = async (file: File | undefined) => {
    if (!file) return
    setError(null)
    try {
      const dataUrl = await readPhotoAsDataUrl(file)
      setPhotoPreview(dataUrl)
      setPhotoUrl(dataUrl)
    } catch (e) {
      setPhotoPreview(null)
      setPhotoUrl(null)
      setError(e instanceof Error ? e.message : 'Invalid photo')
    }
  }

  const handleCreate = async () => {
    if (!isReady) return
    setBusy(true)
    setError(null)
    try {
      const parsedAge = age.trim() ? Number.parseInt(age, 10) : null
      if (age.trim() && (Number.isNaN(parsedAge) || parsedAge! < 0)) {
        setError('Enter a valid age in years, or leave it blank.')
        setBusy(false)
        return
      }

      const res = await apiClient.createDog({
        name: name.trim(),
        breed: breed.trim() || null,
        age: parsedAge,
        photoUrl
      })
      router.replace(`/dogs/${res.data.id}/today`)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not create your dog. Try again.')
      setBusy(false)
    }
  }

  if (!isLoaded || checkingExisting) {
    return (
      <div className="min-h-screen bg-[#0c0c0c] flex items-center justify-center text-zinc-500">
        Loading…
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0c0c0c] text-zinc-100">
      <div className="max-w-lg mx-auto px-4 py-10">
        <p className="text-xs uppercase tracking-widest text-zinc-500">Welcome to Stark Health</p>
        <h1 className="text-2xl font-semibold mt-2">
          {step === 1 ? 'Add your dog' : 'Your care routine'}
        </h1>
        <p className="text-zinc-400 text-sm mt-2">
          {step === 1
            ? 'We’ll attach this dog to your account so you can track PT and daily care.'
            : 'We’ll start you on a mobility and strength plan you can adjust later.'}
        </p>

        <div className="flex gap-2 mt-6" aria-hidden>
          <span className={`h-1 flex-1 rounded-full ${step >= 1 ? 'bg-amber-500' : 'bg-zinc-800'}`} />
          <span className={`h-1 flex-1 rounded-full ${step >= 2 ? 'bg-amber-500' : 'bg-zinc-800'}`} />
        </div>

        {error && <p className="text-red-400 text-sm mt-4">{error}</p>}

        {step === 1 && (
          <form
            className="mt-8 space-y-6"
            onSubmit={e => {
              e.preventDefault()
              if (!name.trim()) {
                setError('What’s your dog’s name?')
                return
              }
              setError(null)
              setStep(2)
            }}
          >
            <div className="flex flex-col items-center gap-3">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="relative size-28 rounded-full border-2 border-dashed border-zinc-700 bg-zinc-900/60 overflow-hidden hover:border-amber-600/60 transition-colors"
              >
                {photoPreview ? (
                  <Image
                    src={photoPreview}
                    alt=""
                    fill
                    className="object-cover"
                    unoptimized
                  />
                ) : (
                  <span className="text-xs text-zinc-500 px-2 text-center leading-tight">
                    Add photo
                    <br />
                    <span className="text-zinc-600">(optional)</span>
                  </span>
                )}
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="sr-only"
                onChange={e => void handlePhotoChange(e.target.files?.[0])}
              />
              {photoPreview && (
                <button
                  type="button"
                  className="text-xs text-zinc-500 underline"
                  onClick={() => {
                    setPhotoPreview(null)
                    setPhotoUrl(null)
                    if (fileInputRef.current) fileInputRef.current.value = ''
                  }}
                >
                  Remove photo
                </button>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="dog-name" className="text-zinc-300">
                Name <span className="text-amber-500">*</span>
              </Label>
              <Input
                id="dog-name"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="e.g. Stark"
                className="bg-zinc-900 border-zinc-700 text-zinc-100"
                autoFocus
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="dog-breed" className="text-zinc-300">
                Breed
              </Label>
              <Input
                id="dog-breed"
                value={breed}
                onChange={e => setBreed(e.target.value)}
                placeholder="Optional"
                className="bg-zinc-900 border-zinc-700 text-zinc-100"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="dog-age" className="text-zinc-300">
                Age (years)
              </Label>
              <Input
                id="dog-age"
                type="number"
                min={0}
                max={30}
                value={age}
                onChange={e => setAge(e.target.value)}
                placeholder="Optional"
                className="bg-zinc-900 border-zinc-700 text-zinc-100"
              />
            </div>

            <Button type="submit" className="w-full bg-amber-600 hover:bg-amber-500 text-black">
              Continue
            </Button>
          </form>
        )}

        {step === 2 && (
          <div className="mt-8">
            <div className="flex items-center gap-4 p-4 rounded-lg border border-zinc-800 bg-zinc-900/40">
              {photoPreview ? (
                <div className="relative size-14 rounded-full overflow-hidden shrink-0">
                  <Image src={photoPreview} alt="" fill className="object-cover" unoptimized />
                </div>
              ) : (
                <div className="size-14 rounded-full bg-zinc-800 flex items-center justify-center text-lg font-medium text-zinc-400 shrink-0">
                  {name.trim().charAt(0).toUpperCase() || '?'}
                </div>
              )}
              <div>
                <p className="font-medium">{name.trim()}</p>
                <p className="text-sm text-zinc-500">
                  {[breed.trim(), age.trim() ? `${age} yrs` : null].filter(Boolean).join(' · ') ||
                    'Care profile'}
                </p>
              </div>
            </div>

            <h2 className="text-sm font-medium text-zinc-300 mt-8">{DEFAULT_ROUTINE_NAME}</h2>
            <p className="text-xs text-zinc-500 mt-1">
              Stretch, strength, and mobility — the same structure used for rehab-focused home PT.
            </p>

            <ul className="mt-4 space-y-2">
              {DEFAULT_ROUTINE_ITEMS.map(item => (
                <li
                  key={item.name}
                  className="flex justify-between gap-3 border border-zinc-800 rounded-lg px-3 py-2.5 bg-zinc-900/30 text-sm"
                >
                  <div>
                    <p className="text-zinc-200">{item.name}</p>
                    <p className="text-xs text-zinc-500">{item.category}</p>
                  </div>
                  <p className="text-xs text-zinc-500 text-right shrink-0">{item.frequency}</p>
                </li>
              ))}
            </ul>

            <div className="flex gap-3 mt-8">
              <Button
                type="button"
                variant="outline"
                className="flex-1 border-zinc-700 text-zinc-300"
                disabled={busy}
                onClick={() => setStep(1)}
              >
                Back
              </Button>
              <Button
                type="button"
                className="flex-1 bg-amber-600 hover:bg-amber-500 text-black"
                disabled={busy}
                onClick={() => void handleCreate()}
              >
                {busy ? 'Setting up…' : 'Start care log'}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
