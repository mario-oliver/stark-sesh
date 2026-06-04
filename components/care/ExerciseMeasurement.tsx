'use client'

import { useState } from 'react'
import { ExerciseTimer } from '@/components/care/ExerciseTimer'
import { MeasurementCompletePrompt } from '@/components/care/MeasurementCompletePrompt'
import { RepCounter } from '@/components/care/RepCounter'
import { getMeasurementMode } from '@/lib/care/measurement'

export function ExerciseMeasurement({
  targetReps,
  targetDurationSeconds,
  onMarkDone,
  busy,
  completed
}: {
  targetReps: number | null
  targetDurationSeconds: number | null
  onMarkDone: () => void
  busy?: boolean
  completed?: boolean
}) {
  const mode = getMeasurementMode(targetReps, targetDurationSeconds)
  const [timerReady, setTimerReady] = useState(false)
  const [repsReady, setRepsReady] = useState(false)

  if (completed || mode === 'checklist') return null

  const showTimerConfirm = (mode === 'timer' || mode === 'both') && timerReady
  const showRepsConfirm = (mode === 'reps' || mode === 'both') && repsReady
  const showConfirm = showTimerConfirm || showRepsConfirm

  const confirmTitle = showTimerConfirm && !showRepsConfirm ? 'Hold complete' : 'Target reached'

  const handleContinue = () => {
    setTimerReady(false)
    setRepsReady(false)
  }

  return (
    <div className="space-y-3 mt-3">
      {(mode === 'timer' || mode === 'both') && targetDurationSeconds != null && (
        <ExerciseTimer
          targetDurationSeconds={targetDurationSeconds}
          disabled={busy || showConfirm}
          onComplete={() => setTimerReady(true)}
        />
      )}
      {(mode === 'reps' || mode === 'both') && targetReps != null && (
        <RepCounter
          targetReps={targetReps}
          disabled={busy || showConfirm}
          onTargetReached={() => setRepsReady(true)}
        />
      )}
      {showConfirm && (
        <MeasurementCompletePrompt
          title={confirmTitle}
          description="Mark this as done when you're finished."
          busy={busy}
          onConfirm={onMarkDone}
          onContinue={handleContinue}
        />
      )}
    </div>
  )
}
