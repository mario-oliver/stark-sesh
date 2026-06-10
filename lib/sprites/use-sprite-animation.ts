'use client'

import { useEffect, useRef, useState } from 'react'
import { framePath, getAnimationDefinition } from '@/lib/sprites/animations'
import type { SpriteAnimation } from '@/lib/sprites/types'
import { resolveFrameSrc, type SpriteSource, BUNDLED_SOURCE } from '@/lib/sprites/source'

function usePrefersReducedMotion(): boolean {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false)

  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)')
    const update = () => setPrefersReducedMotion(media.matches)
    update()
    media.addEventListener('change', update)
    return () => media.removeEventListener('change', update)
  }, [])

  return prefersReducedMotion
}

type UseSpriteAnimationOptions = {
  animation: SpriteAnimation
  loop?: boolean
  fps?: number
  paused?: boolean
  animated?: boolean
  onComplete?: () => void
  /** Override the frame source. Defaults to BUNDLED_SOURCE (reads from SpriteSourceContext). */
  source?: SpriteSource
}

export function useSpriteAnimation({
  animation,
  loop,
  fps,
  paused = false,
  animated,
  onComplete,
  source = BUNDLED_SOURCE
}: UseSpriteAnimationOptions) {
  const definition = getAnimationDefinition(animation)
  const shouldLoop = loop ?? definition.loop
  const frameRate = fps ?? definition.fps
  const prefersReducedMotion = usePrefersReducedMotion()
  const shouldAnimate = animated ?? !prefersReducedMotion

  const [frameIndex, setFrameIndex] = useState(0)
  const completedRef = useRef(false)

  useEffect(() => {
    completedRef.current = false
    setFrameIndex(0)
  }, [animation])

  useEffect(() => {
    if (!shouldAnimate || paused) return

    const frameDuration = 1000 / frameRate
    let lastTime = performance.now()
    let index = 0
    let rafId = 0

    const tick = (now: number) => {
      if (now - lastTime >= frameDuration) {
        lastTime = now
        if (shouldLoop) {
          index = (index + 1) % definition.frames
        } else if (index < definition.frames - 1) {
          index += 1
        }
        setFrameIndex(index)

        if (!shouldLoop && index === definition.frames - 1 && !completedRef.current) {
          completedRef.current = true
          onComplete?.()
        }
      }
      rafId = requestAnimationFrame(tick)
    }

    rafId = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(rafId)
  }, [
    animation,
    definition.frames,
    frameRate,
    onComplete,
    paused,
    shouldAnimate,
    shouldLoop
  ])

  const resolvedIndex = shouldAnimate ? frameIndex : 0

  return {
    frameIndex: resolvedIndex,
    frameSrc: resolveFrameSrc(source, animation, resolvedIndex),
    prefersReducedMotion,
    shouldAnimate
  }
}
