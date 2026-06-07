'use client'

import { Mic, Square } from 'lucide-react'
import { useCallback, useRef, useState } from 'react'
import { SpriteOverlay } from '@/components/sprite/SpriteOverlay'
import { blobToWav } from '@/lib/audio-to-wav'
import { Button } from '@/components/ui/button'

type VoiceRecordBarProps = {
  disabled?: boolean
  isProcessing?: boolean
  onRecordingComplete: (wavBlob: Blob) => Promise<void>
  hint?: string
}

export function VoiceRecordBar({
  disabled,
  isProcessing,
  onRecordingComplete,
  hint = 'Tap to record a care update.'
}: VoiceRecordBarProps) {
  const [isRecording, setIsRecording] = useState(false)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const recorder = new MediaRecorder(stream)
      chunksRef.current = []
      recorder.ondataavailable = e => {
        if (e.data.size > 0) chunksRef.current.push(e.data)
      }
      recorder.onstop = async () => {
        stream.getTracks().forEach(t => t.stop())
        const blob = new Blob(chunksRef.current, { type: recorder.mimeType || 'audio/webm' })
        const wavBlob = await blobToWav(blob)
        await onRecordingComplete(wavBlob)
      }
      mediaRecorderRef.current = recorder
      recorder.start()
      setIsRecording(true)
    } catch (err) {
      console.error('Failed to start recording', err)
    }
  }, [onRecordingComplete])

  const stopRecording = useCallback(() => {
    const recorder = mediaRecorderRef.current
    if (recorder && recorder.state !== 'inactive') {
      recorder.stop()
    }
    setIsRecording(false)
  }, [])

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-background/95 border-t border-border flex flex-col items-center gap-2 pt-3 px-4 pb-[max(1rem,env(safe-area-inset-bottom))] z-50">
      {!isRecording ? (
        <Button
          type="button"
          size="record"
          onClick={() => void startRecording()}
          disabled={disabled || isProcessing}
          className="touch-target shadow-lg ring-4 ring-primary/20"
          title="Record care update"
        >
          <Mic />
        </Button>
      ) : (
        <Button
          type="button"
          variant="destructive"
          size="record"
          onClick={stopRecording}
          className="touch-target shadow-lg animate-pulse [&_svg:not([class*='size-'])]:size-8 sm:[&_svg:not([class*='size-'])]:size-10"
          title="Stop recording"
        >
          <Square fill="currentColor" />
        </Button>
      )}
      {isRecording && (
        <SpriteOverlay preset="voiceListening" mode="inline" size="small" className="py-2" />
      )}
      {!isRecording && (
        <p className="text-sm text-muted-foreground text-center max-w-sm">
          {isProcessing ? 'Processing your update…' : hint}
        </p>
      )}
    </div>
  )
}
