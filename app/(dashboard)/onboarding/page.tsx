'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuth } from '@clerk/nextjs'
import { useEffect, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useApiClient } from '@/hooks/use-api-client'
import { DEFAULT_ROUTINE_ITEMS, DEFAULT_ROUTINE_NAME } from '@/lib/care/default-routine'
import { uploadDogPhotoToS3 } from '@/lib/upload-dog-photo'

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
  const [photoKey, setPhotoKey] = useState<string | null>(null)
  const [photoUploading, setPhotoUploading] = useState(false)
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
    if (!file || !isReady) return
    setError(null)
    setPhotoUploading(true)
    try {
      const { photoKey: key, viewUrl } = await uploadDogPhotoToS3(apiClient, file)
      setPhotoKey(key)
      setPhotoPreview(viewUrl)
    } catch (e) {
      setPhotoKey(null)
      setPhotoPreview(null)
      setError(e instanceof Error ? e.message : 'Invalid photo')
    } finally {
      setPhotoUploading(false)
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
        photoKey
      })
      router.replace(`/dogs/${res.data.id}/today`)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not create your dog. Try again.')
      setBusy(false)
    }
  }

  if (!isLoaded || checkingExisting) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center text-muted-foreground">
        Loading…
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="max-w-lg mx-auto px-4 py-10">
        <p className="text-xs uppercase tracking-widest text-muted-foreground">Welcome to Stark Health</p>
        <h1 className="text-2xl font-semibold mt-2">
          {step === 1 ? 'Add your dog' : 'Your care routine'}
        </h1>
        <p className="text-muted-foreground text-sm mt-2">
          {step === 1
            ? 'We’ll attach this dog to your account so you can track PT and daily care.'
            : 'We’ll start you on a mobility and strength plan you can adjust later.'}
        </p>

        <div className="flex gap-2 mt-6" aria-hidden>
          <span className={`h-1 flex-1 rounded-full ${step >= 1 ? 'bg-primary' : 'bg-muted'}`} />
          <span className={`h-1 flex-1 rounded-full ${step >= 2 ? 'bg-primary' : 'bg-muted'}`} />
        </div>

        {error && <p className="text-destructive text-sm mt-4">{error}</p>}

        {step === 1 && (
          <form
            className="mt-8 space-y-6"
            onSubmit={e => {
              e.preventDefault()
              if (!name.trim()) {
                setError('What’s your dog’s name?')
                return
              }
              if (photoUploading) {
                setError('Wait for the photo to finish uploading.')
                return
              }
              setError(null)
              setStep(2)
            }}
          >
            <div className="flex flex-col items-center gap-3">
              <Button
                type="button"
                variant="outline"
                disabled={photoUploading}
                onClick={() => fileInputRef.current?.click()}
                className="relative size-36 rounded-full border-2 border-dashed bg-muted/60 overflow-hidden hover:border-primary/60 h-auto p-0"
              >
                {photoPreview ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={photoPreview}
                    alt=""
                    className="size-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <span className="text-xs text-muted-foreground px-2 text-center leading-tight">
                    {photoUploading ? 'Uploading…' : 'Add photo'}
                    <br />
                    <span className="text-muted-foreground/70">(optional)</span>
                  </span>
                )}
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                className="sr-only"
                onChange={e => void handlePhotoChange(e.target.files?.[0])}
              />
              {photoPreview && (
                <Button
                  type="button"
                  variant="link"
                  size="xs"
                  className="h-auto px-0 text-muted-foreground"
                  onClick={() => {
                    setPhotoPreview(null)
                    setPhotoKey(null)
                    if (fileInputRef.current) fileInputRef.current.value = ''
                  }}
                >
                  Remove photo
                </Button>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="dog-name">
                Name <span className="text-primary">*</span>
              </Label>
              <Input
                id="dog-name"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="e.g. Stark"
                autoFocus
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="dog-breed">Breed</Label>
              <Input
                id="dog-breed"
                value={breed}
                onChange={e => setBreed(e.target.value)}
                placeholder="Optional"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="dog-age">Age (years)</Label>
              <Input
                id="dog-age"
                type="number"
                min={0}
                max={30}
                value={age}
                onChange={e => setAge(e.target.value)}
                placeholder="Optional"
              />
            </div>

            <Button type="submit" disabled={photoUploading} className="w-full">
              Continue
            </Button>

            <p className="text-center text-sm text-muted-foreground pt-2">
              Have a share code?{' '}
              <Link href="/join" className="text-primary underline hover:text-primary/80">
                Join an existing dog
              </Link>
            </p>
          </form>
        )}

        {step === 2 && (
          <div className="mt-8">
            <div className="flex items-center gap-4 p-4 rounded-lg border border-border bg-card">
              {photoPreview ? (
                <div className="relative size-20 rounded-full overflow-hidden shrink-0 border border-border">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={photoPreview}
                    alt=""
                    className="size-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                </div>
              ) : (
                <div className="size-20 rounded-full bg-muted flex items-center justify-center text-xl font-medium text-muted-foreground shrink-0">
                  {name.trim().charAt(0).toUpperCase() || '?'}
                </div>
              )}
              <div>
                <p className="font-medium">{name.trim()}</p>
                <p className="text-sm text-muted-foreground">
                  {[breed.trim(), age.trim() ? `${age} yrs` : null].filter(Boolean).join(' · ') ||
                    'Care profile'}
                </p>
              </div>
            </div>

            <h2 className="text-sm font-medium text-foreground mt-8">{DEFAULT_ROUTINE_NAME}</h2>
            <p className="text-xs text-muted-foreground mt-1">
              Stretch, strength, and mobility — the same structure used for rehab-focused home PT.
            </p>

            <ul className="mt-4 space-y-2">
              {DEFAULT_ROUTINE_ITEMS.map(item => (
                <li
                  key={item.name}
                  className="flex justify-between gap-3 border border-border rounded-lg px-3 py-2.5 bg-card text-sm"
                >
                  <div>
                    <p className="text-foreground">{item.name}</p>
                    <p className="text-xs text-muted-foreground">{item.category}</p>
                  </div>
                  <p className="text-xs text-muted-foreground text-right shrink-0">{item.frequency}</p>
                </li>
              ))}
            </ul>

            <div className="flex gap-3 mt-8">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                disabled={busy}
                onClick={() => setStep(1)}
              >
                Back
              </Button>
              <Button
                type="button"
                className="flex-1"
                disabled={busy || photoUploading}
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
