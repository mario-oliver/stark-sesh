'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useApiClient } from '@/hooks/use-api-client'
import { useActiveDog } from '@/hooks/use-active-dog'
import { uploadDogPhotoToS3 } from '@/lib/upload-dog-photo'
import { SpriteOverlay } from '@/components/sprite/SpriteOverlay'
import { StarkSprite } from '@/components/sprite/StarkSprite'
import { SpriteSourceProvider } from '@/lib/sprites/SpriteSourceContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { DogSubNav } from '@/components/dog/DogSubNav'
import type { SpriteGenerationSessionRecord, SpriteSetRecord } from '@/lib/api/endpoints/dogs'
import { VoiceRecordBar } from '@/components/voice/VoiceRecordBar'
import Link from 'next/link'

const POLL_INTERVAL_MS = 3000

type Phase =
  | 'idle'
  | 'uploading'
  | 'generating'
  | 'complete'
  | 'error'

export function CompanionPageClient({ dogId }: { dogId: string }) {
  return (
    <SpriteSourceProvider dogId={dogId}>
      <CompanionPageClientInner dogId={dogId} />
    </SpriteSourceProvider>
  )
}

function CompanionPageClientInner({ dogId }: { dogId: string }) {
  const { apiClient, isReady } = useApiClient()
  useActiveDog(dogId)

  const [phase, setPhase] = useState<Phase>('idle')
  const [error, setError] = useState<string | null>(null)

  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const [breed, setBreed] = useState('')

  const [session, setSession] = useState<SpriteGenerationSessionRecord | null>(null)
  const [spriteSet, setSpriteSet] = useState<SpriteSetRecord | null>(null)

  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Load existing active sprite set on mount
  useEffect(() => {
    if (!isReady) return
    apiClient.getDogSpriteSet(dogId)
      .then((res) => {
        if (res.data) setSpriteSet(res.data)
      })
      .catch(() => {})
  }, [dogId, isReady, apiClient])

  const stopPolling = useCallback(() => {
    if (pollRef.current) {
      clearInterval(pollRef.current)
      pollRef.current = null
    }
  }, [])

  useEffect(() => () => stopPolling(), [stopPolling])

  const startPolling = useCallback((sessionId: string) => {
    stopPolling()
    pollRef.current = setInterval(async () => {
      try {
        const res = await apiClient.getSpriteSession(dogId, sessionId)
        const s = res.data
        setSession(s)

        if (s.status === 'COMPLETED') {
          stopPolling()
          const setRes = await apiClient.getDogSpriteSet(dogId)
          if (setRes.data) setSpriteSet(setRes.data)
          setPhase('complete')
        } else if (s.status === 'FAILED' || s.status === 'CANCELED') {
          stopPolling()
          setError(s.error ?? 'Sprite generation failed. Please try again.')
          setPhase('error')
        }
      } catch {
        // Ignore transient fetch errors during polling
      }
    }, POLL_INTERVAL_MS)
  }, [apiClient, dogId, stopPolling])

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setPhotoFile(file)
    setPhotoPreview(URL.createObjectURL(file))
  }

  const handleVoiceBreed = async (wavBlob: Blob): Promise<void> => {
    const file = new File([wavBlob], 'recording.wav', { type: 'audio/wav' })
    try {
      const res = await apiClient.transcribeVoiceNote(dogId, file)
      const text = res.data.text
      if (text?.trim()) setBreed(text.trim())
    } catch {
      // Silently skip transcription errors
    }
  }

  const handleGenerate = async () => {
    if (!isReady || !photoFile || !breed.trim()) return
    setError(null)
    setPhase('uploading')

    try {
      const { photoKey } = await uploadDogPhotoToS3(apiClient, photoFile)

      setPhase('generating')
      const res = await apiClient.createSpriteSession(dogId, { photoKey, breed: breed.trim() })
      const newSession = res.data
      setSession(newSession)
      startPolling(newSession.id)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start generation')
      setPhase('error')
    }
  }

  const canGenerate = !!photoFile && breed.trim().length > 0 && phase === 'idle'

  return (
    <div className="min-h-screen bg-background text-foreground pb-24">
      <div className="max-w-lg mx-auto px-4 pt-6">
        <Link href={`/dogs/${dogId}/today`} className="text-sm text-primary hover:text-primary/80 underline">
          ← Back
        </Link>

        <DogSubNav dogId={dogId} />

        <header className="mt-6 mb-6">
          <h1 className="text-2xl font-semibold text-foreground">Your Companion</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Generate a custom sprite of your dog from a photo. It'll appear throughout the app wherever Stark normally shows up.
          </p>
        </header>

        {/* Active sprite preview */}
        {spriteSet && phase !== 'generating' && (
          <section className="mb-8 p-4 border border-border rounded-2xl bg-card/60">
            <p className="text-xs text-muted-foreground mb-3 uppercase tracking-wide">Active companion</p>
            <div className="flex gap-4 items-center justify-center">
              <div className="flex flex-col items-center gap-1">
                <StarkSprite animation="idle" size="large" />
                <span className="text-xs text-muted-foreground">Idle</span>
              </div>
              <div className="flex flex-col items-center gap-1">
                <StarkSprite animation="run" size="large" />
                <span className="text-xs text-muted-foreground">Run</span>
              </div>
              <div className="flex flex-col items-center gap-1">
                <StarkSprite animation="bark" size="large" />
                <span className="text-xs text-muted-foreground">Bark</span>
              </div>
            </div>
            <p className="text-xs text-muted-foreground text-center mt-3">
              {spriteSet.manifest.breed} · Generated {new Date(spriteSet.createdAt).toLocaleDateString()}
            </p>
          </section>
        )}

        {/* Generation form */}
        {(phase === 'idle' || phase === 'error') && (
          <section className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="sprite-photo">Dog photo</Label>
              <div className="flex items-center gap-3">
                {photoPreview && (
                  <img
                    src={photoPreview}
                    alt="Preview"
                    className="size-16 rounded-xl object-cover border border-border shrink-0"
                  />
                )}
                <Button asChild variant="outline" className="w-full">
                  <label htmlFor="sprite-photo" className="cursor-pointer">
                    {photoFile ? 'Change photo' : 'Choose photo'}
                    <input
                      id="sprite-photo"
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      className="sr-only"
                      onChange={handlePhotoChange}
                    />
                  </label>
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Best results: clear side-profile photo on a plain background.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="sprite-breed">Breed</Label>
              <div className="flex gap-2">
                <Input
                  id="sprite-breed"
                  value={breed}
                  onChange={(e) => setBreed(e.target.value)}
                  placeholder="e.g. Golden Retriever, Lab/Pit mix"
                  className="flex-1"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Or say it — record breed via voice below and it'll fill in automatically.
              </p>
            </div>

            {error && (
              <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
                {error}
              </div>
            )}

            <Button
              onClick={() => void handleGenerate()}
              disabled={!canGenerate || !isReady}
              className="w-full"
            >
              Generate companion sprite
            </Button>

            <p className="text-xs text-muted-foreground text-center">
              Generation takes 1–3 minutes. You can leave this page and come back.
            </p>
          </section>
        )}

        {/* Uploading */}
        {phase === 'uploading' && (
          <SpriteOverlay preset="savingNote" mode="blocking" />
        )}

        {/* Generating — show progress */}
        {phase === 'generating' && session && (
          <div className="space-y-4">
            <SpriteOverlay
              animation="walk"
              message="Creating your companion…"
              subtext={session.currentStep
                ? `${session.currentStep.replace(/_/g, ' ').toLowerCase()} · ${Math.round(session.progress)}%`
                : `${Math.round(session.progress)}% complete`}
              mode="inline"
            />
            <div className="w-full bg-muted rounded-full h-1.5">
              <div
                className="bg-primary rounded-full h-1.5 transition-all duration-500"
                style={{ width: `${session.progress}%` }}
              />
            </div>
          </div>
        )}

        {/* Complete */}
        {phase === 'complete' && spriteSet && (
          <div className="space-y-4">
            <SpriteOverlay
              animation="playbow"
              message="Companion ready."
              subtext={`${spriteSet.manifest.breed} sprite set is live.`}
              mode="inline"
            />
            <Button
              variant="outline"
              className="w-full"
              onClick={() => {
                setPhase('idle')
                setPhotoFile(null)
                setPhotoPreview(null)
                setBreed('')
                setSession(null)
              }}
            >
              Generate another
            </Button>
          </div>
        )}
      </div>

      {/* Voice for breed input */}
      {phase === 'idle' && (
        <VoiceRecordBar
          isProcessing={false}
          onRecordingComplete={handleVoiceBreed}
          hint="Say your dog's breed"
        />
      )}
    </div>
  )
}
