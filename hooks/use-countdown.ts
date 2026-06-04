'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

export function useCountdown(initialSeconds: number, onComplete?: () => void) {
  const [remaining, setRemaining] = useState(initialSeconds)
  const [running, setRunning] = useState(false)
  const onCompleteRef = useRef(onComplete)
  onCompleteRef.current = onComplete

  const reset = useCallback(() => {
    setRunning(false)
    setRemaining(initialSeconds)
  }, [initialSeconds])

  useEffect(() => {
    setRemaining(initialSeconds)
    setRunning(false)
  }, [initialSeconds])

  useEffect(() => {
    if (!running || remaining <= 0) return

    const id = window.setInterval(() => {
      setRemaining(prev => {
        if (prev <= 1) {
          setRunning(false)
          onCompleteRef.current?.()
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => window.clearInterval(id)
  }, [running, remaining])

  const start = useCallback(() => {
    if (remaining <= 0) {
      setRemaining(initialSeconds)
    }
    setRunning(true)
  }, [remaining, initialSeconds])

  const pause = useCallback(() => setRunning(false), [])

  return { remaining, running, start, pause, reset }
}
