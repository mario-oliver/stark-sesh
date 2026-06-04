'use client'

import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import { DogHero } from '@/components/dog/DogHero'
import { DogProfileFields } from '@/components/dog/DogProfileFields'
import { Button } from '@/components/ui/button'
import { useApiClient } from '@/hooks/use-api-client'
import { useActiveDog } from '@/hooks/use-active-dog'
import type { DogRecord } from '@/lib/api/endpoints/dogs'
import {
  dogToProfileForm,
  formatDogSex,
  profileFormToApiPayload,
  validateDogProfileForm,
  type DogProfileFormValues
} from '@/lib/dog/profile-form'
import { formatShareCode } from '@/lib/share-code'
import { uploadDogPhotoToS3 } from '@/lib/upload-dog-photo'

function ProfileDetail({ label, value }: { label: string; value: string | null | undefined }) {
  if (!value) return null
  return (
    <div>
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="text-sm text-foreground mt-0.5">{value}</dd>
    </div>
  )
}

export function ProfileClient({ dogId }: { dogId: string }) {
  const { apiClient, isReady } = useApiClient()
  useActiveDog(dogId)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [dog, setDog] = useState<DogRecord | null>(null)
  const [copied, setCopied] = useState(false)
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState<DogProfileFormValues | null>(null)
  const [photoKey, setPhotoKey] = useState<string | null>(null)
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const [photoUploading, setPhotoUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

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

  const startEditing = () => {
    if (!dog) return
    setForm(dogToProfileForm(dog))
    setPhotoKey(null)
    setPhotoPreview(null)
    setError(null)
    setEditing(true)
  }

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

  const handleSave = async () => {
    if (!isReady || !form) return
    const validationError = validateDogProfileForm(form)
    if (validationError) {
      setError(validationError)
      return
    }
    setBusy(true)
    setError(null)
    try {
      const payload = profileFormToApiPayload(form)
      const res = await apiClient.updateDog(dogId, {
        ...payload,
        ...(photoKey !== null ? { photoKey } : {})
      })
      setDog(res.data)
      setEditing(false)
      setForm(null)
      setPhotoKey(null)
      setPhotoPreview(null)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not save profile')
    } finally {
      setBusy(false)
    }
  }

  if (!dog) {
    return (
      <div className="min-h-screen bg-background text-muted-foreground flex items-center justify-center">
        Loading…
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background text-foreground max-w-lg mx-auto px-4 py-8 pb-16">
      <Link href="/today" className="text-sm text-primary underline">
        ← Care
      </Link>

      <div className="mt-6 flex items-start justify-between gap-4">
        <p className="text-sm text-muted-foreground">Pet profile</p>
        {!editing && (
          <Button type="button" variant="outline" size="sm" onClick={startEditing}>
            Edit
          </Button>
        )}
      </div>

      {error && <p className="text-destructive text-sm mt-4">{error}</p>}

      {editing && form ? (
        <div className="mt-6 space-y-6">
          <DogHero
            dogId={dog.id}
            photoUrl={dog.photoUrl}
            displayPhotoUrl={photoPreview}
            name={form.name.trim() || dog.name}
            onPhotoClick={() => fileInputRef.current?.click()}
            photoUploading={photoUploading}
          />
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            className="sr-only"
            onChange={e => void handlePhotoChange(e.target.files?.[0])}
          />

          <DogProfileFields
            form={form}
            onChange={updates => setForm(prev => (prev ? { ...prev, ...updates } : prev))}
          />

          <div className="flex gap-3">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              disabled={busy}
              onClick={() => {
                setEditing(false)
                setForm(null)
                setPhotoKey(null)
                setPhotoPreview(null)
                setError(null)
              }}
            >
              Cancel
            </Button>
            <Button
              type="button"
              className="flex-1"
              disabled={busy || photoUploading}
              onClick={() => void handleSave()}
            >
              {busy ? 'Saving…' : 'Save profile'}
            </Button>
          </div>
        </div>
      ) : (
        <>
          <div className="mt-6">
            <DogHero dogId={dog.id} photoUrl={dog.photoUrl} name={dog.name} />
          </div>

          <dl className="mt-6 grid gap-4 border border-border rounded-lg p-4 bg-card">
            <ProfileDetail label="Breed" value={dog.breed} />
            <ProfileDetail
              label="Age"
              value={dog.age != null ? `${dog.age} years` : null}
            />
            <ProfileDetail label="Sex" value={formatDogSex(dog.sex)} />
            <ProfileDetail
              label="Weight"
              value={dog.weightLbs != null ? `${dog.weightLbs} lbs` : null}
            />
            <ProfileDetail label="Condition" value={dog.condition} />
            <ProfileDetail label="Veterinarian" value={dog.vetName} />
            <ProfileDetail label="Vet phone" value={dog.vetPhone} />
            <ProfileDetail label="Care notes" value={dog.notes} />
          </dl>

          {!dog.breed &&
            dog.age == null &&
            !dog.sex &&
            dog.weightLbs == null &&
            !dog.condition &&
            !dog.vetName &&
            !dog.vetPhone &&
            !dog.notes && (
              <p className="text-sm text-muted-foreground mt-4">
                Add breed, condition, vet info, and more with Edit profile.
              </p>
            )}

          {dog.shareCode && (
            <section className="mt-8 border border-border rounded-lg p-4 bg-card">
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
        </>
      )}
    </div>
  )
}
