'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuth } from '@clerk/nextjs'
import { useEffect, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { DogProfileFields } from '@/components/dog/DogProfileFields'
import { SpriteOverlay } from '@/components/sprite/SpriteOverlay'
import { useApiClient } from '@/hooks/use-api-client'
import { resolveDogId, setActiveDogId } from '@/lib/active-dog'
import { DEFAULT_ROUTINE_ITEMS, DEFAULT_ROUTINE_NAME } from '@/lib/care/default-routine'
import {
  emptyDogProfileForm,
  formatDogSex,
  profileFormToApiPayload,
  validateDogProfileForm,
  type DogProfileFormValues
} from '@/lib/dog/profile-form'
import { uploadDogPhotoToS3 } from '@/lib/upload-dog-photo'

export default function OnboardingPage() {
  const router = useRouter()
  const { isLoaded, isSignedIn } = useAuth()
  const { apiClient, isReady } = useApiClient()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [step, setStep] = useState<1 | 2>(1)
  const [form, setForm] = useState<DogProfileFormValues>(emptyDogProfileForm())
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
          router.replace(`/dogs/${resolveDogId(res.data)}/today`)
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
    const validationError = validateDogProfileForm(form)
    if (validationError) {
      setError(validationError)
      return
    }
    setBusy(true)
    setError(null)
    try {
      const res = await apiClient.createDog({
        ...profileFormToApiPayload(form),
        photoKey
      })
      setActiveDogId(res.data.id)
      router.replace(`/dogs/${res.data.id}/today`)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not create your dog. Try again.')
      setBusy(false)
    }
  }

  if (!isLoaded || checkingExisting) {
    return <SpriteOverlay preset="dailyPlanLoading" mode="blocking" />
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
            ? 'Tell us about your dog — the basics plus anything that helps with PT and daily care.'
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
              const validationError = validateDogProfileForm(form)
              if (validationError) {
                setError(validationError)
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

            <DogProfileFields
              form={form}
              onChange={updates => setForm(prev => ({ ...prev, ...updates }))}
            />

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
                  {form.name.trim().charAt(0).toUpperCase() || '?'}
                </div>
              )}
              <div>
                <p className="font-medium">{form.name.trim()}</p>
                <p className="text-sm text-muted-foreground">
                  {[
                    form.breed.trim(),
                    form.age.trim() ? `${form.age} yrs` : null,
                    formatDogSex(form.sex || null)
                  ]
                    .filter(Boolean)
                    .join(' · ') || 'Care profile'}
                </p>
                {form.condition.trim() && (
                  <p className="text-xs text-muted-foreground mt-1">{form.condition.trim()}</p>
                )}
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
                    <p className="text-xs text-muted-foreground">{item.bucket}</p>
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
