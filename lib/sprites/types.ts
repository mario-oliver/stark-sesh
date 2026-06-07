export const SPRITE_ANIMATIONS = [
  'idle',
  'run',
  'walk',
  'sitA',
  'sitB',
  'bark',
  'playbow'
] as const

export type SpriteAnimation = (typeof SPRITE_ANIMATIONS)[number]

export type SpriteSize = 'small' | 'medium' | 'large'

export type SpriteOverlayMode = 'blocking' | 'inline'

export type SpriteBackground = 'dimmed' | 'transparent' | 'solid'

export type SpritePresetKey =
  | 'dailyPlanLoading'
  | 'voiceListening'
  | 'voiceProcessing'
  | 'exerciseComplete'
  | 'savingNote'
  | 'recoveryScoring'
  | 'emptyState'
  | 'notificationSetup'
  | 'dayComplete'
  | 'errorRetry'
  | 'caregiverSync'

export type SpriteAnimationDefinition = {
  frames: number
  fps: number
  loop: boolean
}

export type SpritePresetConfig = {
  animation: SpriteAnimation
  message?: string
  subtext?: string
  mode: SpriteOverlayMode
  background: SpriteBackground
}

export type StarkSpriteProps = {
  animation: SpriteAnimation
  size?: SpriteSize
  loop?: boolean
  animated?: boolean
  paused?: boolean
  className?: string
  onComplete?: () => void
}

export type SpriteOverlayProps = {
  animation?: SpriteAnimation
  message?: string
  subtext?: string
  mode?: SpriteOverlayMode
  background?: SpriteBackground
  size?: SpriteSize
  loop?: boolean
  animated?: boolean
  preset?: SpritePresetKey
  className?: string
  onComplete?: () => void
}

export const SPRITE_SIZE_PX: Record<SpriteSize, number> = {
  small: 72,
  medium: 120,
  large: 168
}
