'use client'

import { useEffect } from 'react'
import { SpriteOverlay } from '@/components/sprite/SpriteOverlay'
import { pickCompletionAnimation } from '@/lib/sprites/pick-completion-animation'

const DEFAULT_DURATION_MS = 2500

export function SpriteCompletionFlash({
  visible,
  seed,
  durationMs = DEFAULT_DURATION_MS,
  onDismiss
}: {
  visible: boolean
  seed: string
  durationMs?: number
  onDismiss?: () => void
}) {
  useEffect(() => {
    if (!visible) return
    const id = window.setTimeout(() => onDismiss?.(), durationMs)
    return () => window.clearTimeout(id)
  }, [visible, durationMs, onDismiss])

  if (!visible) return null

  return (
    <SpriteOverlay
      animation={pickCompletionAnimation(seed)}
      message="Nice work."
      subtext="Logged for today."
      mode="inline"
      size="small"
      className="py-3"
    />
  )
}
