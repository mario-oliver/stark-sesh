'use client'

import { Mic, Square } from 'lucide-react'
import { useCallback, useRef, useState } from 'react'
import { blobToWav } from '@/lib/audio-to-wav'

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
    <div className="fixed bottom-0 left-0 right-0 bg-[#0c0c0c]/95 border-t border-zinc-800 flex flex-col items-center gap-2 pt-3 px-4 pb-[max(1rem,env(safe-area-inset-bottom))] z-50">
      {!isRecording ? (
        <button
          type="button"
          onClick={() => void startRecording()}
          disabled={disabled || isProcessing}
          className="flex items-center justify-center w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-amber-500 active:bg-amber-400 disabled:opacity-50 disabled:cursor-not-allowed text-black transition-colors touch-target shadow-lg"
          title="Record care update"
        >
          <Mic className="w-10 h-10 sm:w-12 sm:h-12" />
        </button>
      ) : (
        <button
          type="button"
          onClick={stopRecording}
          className="flex items-center justify-center w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-red-500 active:bg-red-400 text-white transition-colors animate-pulse touch-target shadow-lg"
          title="Stop recording"
        >
          <Square className="w-8 h-8 sm:w-10 sm:h-10" fill="currentColor" />
        </button>
      )}
      <p className="text-sm text-zinc-500 text-center max-w-sm">
        {isRecording
          ? 'Recording… Tap to stop and send.'
          : isProcessing
            ? 'Processing your update…'
            : hint}
      </p>
    </div>
  )
}
