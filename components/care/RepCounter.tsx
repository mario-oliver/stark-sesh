'use client'

import { useEffect, useState } from 'react'
import { Minus, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function RepCounter({
  targetReps,
  onTargetReached,
  disabled
}: {
  targetReps: number
  onTargetReached: () => void
  disabled?: boolean
}) {
  const [count, setCount] = useState(0)
  const [targetReached, setTargetReached] = useState(false)

  useEffect(() => {
    setCount(0)
    setTargetReached(false)
  }, [targetReps])

  const adjust = (delta: number) => {
    if (disabled) return
    setCount(prev => {
      const next = Math.max(0, prev + delta)
      if (!targetReached && next >= targetReps) {
        setTargetReached(true)
        onTargetReached()
      }
      return next
    })
  }

  const reset = () => {
    setCount(0)
    setTargetReached(false)
  }

  return (
    <div className="rounded-lg border border-border bg-muted/30 p-3 space-y-2">
      <p className="text-xs text-muted-foreground">Target: {targetReps} reps</p>
      <div className="flex items-center justify-center gap-4">
        <Button
          type="button"
          variant="outline"
          size="icon"
          disabled={disabled || count <= 0}
          onClick={() => adjust(-1)}
          aria-label="Decrease reps"
        >
          <Minus className="size-4" />
        </Button>
        <span className="text-3xl font-semibold tabular-nums min-w-[4ch] text-center">
          {count}
          <span className="text-lg text-muted-foreground font-normal"> / {targetReps}</span>
        </span>
        <Button
          type="button"
          variant="outline"
          size="icon"
          disabled={disabled}
          onClick={() => adjust(1)}
          aria-label="Increase reps"
        >
          <Plus className="size-4" />
        </Button>
      </div>
      {count > 0 && (
        <Button type="button" variant="ghost" size="xs" disabled={disabled} onClick={reset}>
          Reset count
        </Button>
      )}
    </div>
  )
}
