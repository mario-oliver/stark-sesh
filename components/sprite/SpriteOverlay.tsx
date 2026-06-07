'use client'

import { StarkSprite } from '@/components/sprite/StarkSprite'
import { resolveSpritePreset } from '@/lib/sprites/presets'
import type { SpriteBackground, SpriteOverlayMode, SpriteOverlayProps } from '@/lib/sprites/types'
import { cn } from '@/lib/utils'

function defaultBackground(mode: SpriteOverlayMode): SpriteBackground {
  return mode === 'blocking' ? 'dimmed' : 'transparent'
}

function backgroundClass(background: SpriteBackground, mode: SpriteOverlayMode): string {
  switch (background) {
    case 'dimmed':
      return mode === 'blocking'
        ? 'fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm'
        : 'bg-background/80 backdrop-blur-sm'
    case 'solid':
      return mode === 'blocking'
        ? 'fixed inset-0 z-50 flex items-center justify-center bg-background'
        : 'bg-background'
    case 'transparent':
      return mode === 'blocking'
        ? 'fixed inset-0 z-50 flex items-center justify-center'
        : ''
  }
}

export function SpriteOverlay({
  animation,
  message,
  subtext,
  mode,
  background,
  size = 'medium',
  loop,
  animated,
  preset,
  className,
  onComplete
}: SpriteOverlayProps) {
  const presetConfig = preset ? resolveSpritePreset(preset) : null

  const resolvedAnimation = animation ?? presetConfig?.animation
  const resolvedMessage = message ?? presetConfig?.message
  const resolvedSubtext = subtext ?? presetConfig?.subtext
  const resolvedMode = mode ?? presetConfig?.mode ?? 'blocking'
  const resolvedBackground = background ?? presetConfig?.background ?? defaultBackground(resolvedMode)

  if (!resolvedAnimation) {
    return null
  }

  const content = (
    <div className="flex flex-col items-center gap-4 p-6 animate-in fade-in-0 zoom-in-95 duration-300">
      <StarkSprite
        animation={resolvedAnimation}
        size={size}
        loop={loop}
        animated={animated}
        onComplete={onComplete}
      />
      {(resolvedMessage || resolvedSubtext) && (
        <div className="flex max-w-xs flex-col items-center gap-1.5 text-center">
          {resolvedMessage && (
            <p className="text-base font-medium text-foreground">{resolvedMessage}</p>
          )}
          {resolvedSubtext && (
            <p className="text-sm text-muted-foreground">{resolvedSubtext}</p>
          )}
        </div>
      )}
    </div>
  )

  if (resolvedMode === 'blocking') {
    return (
      <div
        className={backgroundClass(resolvedBackground, resolvedMode)}
        role="status"
        aria-live="polite"
        aria-busy="true"
      >
        {content}
      </div>
    )
  }

  return (
    <div className={cn(backgroundClass(resolvedBackground, resolvedMode), className)} role="status">
      {content}
    </div>
  )
}
