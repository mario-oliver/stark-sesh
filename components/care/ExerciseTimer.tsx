'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { useCountdown } from '@/hooks/use-countdown'
import { formatCountdown } from '@/lib/care/measurement'

export function ExerciseTimer({
  targetDurationSeconds,
  onComplete,
  disabled
}: {
  targetDurationSeconds: number
  onComplete: () => void
  disabled?: boolean
}) {
  const [completed, setCompleted] = useState(false)
  const { remaining, running, start, pause, reset } = useCountdown(targetDurationSeconds, () => {
    setCompleted(true)
    onComplete()
  })

  const handleReset = () => {
    setCompleted(false)
    reset()
  }

  return (
    <div className="rounded-lg border border-border bg-muted/30 p-3 space-y-2">
      <p className="text-xs text-muted-foreground">
        Hold for {formatCountdown(targetDurationSeconds)}
      </p>
      <p className="text-3xl font-semibold tabular-nums text-foreground">
        {formatCountdown(remaining)}
      </p>
      <div className="flex flex-wrap gap-2">
        {!running && remaining > 0 && (
          <Button type="button" size="sm" disabled={disabled} onClick={start}>
            Start
          </Button>
        )}
        {running && (
          <Button type="button" variant="outline" size="sm" disabled={disabled} onClick={pause}>
            Pause
          </Button>
        )}
        {(running || remaining < targetDurationSeconds || completed) && (
          <Button type="button" variant="outline" size="sm" disabled={disabled} onClick={handleReset}>
            Reset
          </Button>
        )}
      </div>
    </div>
  )
}
