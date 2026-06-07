import type { SpriteAnimation, SpriteAnimationDefinition } from '@/lib/sprites/types'

export const SPRITE_ANIMATION_DEFINITIONS: Record<SpriteAnimation, SpriteAnimationDefinition> = {
  idle: { frames: 5, fps: 6, loop: true },
  run: { frames: 3, fps: 10, loop: true },
  walk: { frames: 4, fps: 8, loop: true },
  sitA: { frames: 2, fps: 4, loop: false },
  sitB: { frames: 2, fps: 4, loop: false },
  bark: { frames: 2, fps: 6, loop: true },
  playbow: { frames: 2, fps: 5, loop: false }
}

export function frameAssetName(animation: SpriteAnimation, frameIndex: number): string {
  const padded = String(frameIndex + 1).padStart(3, '0')
  return `${animation}_${padded}`
}

export function framePath(animation: SpriteAnimation, frameIndex: number): string {
  const name = frameAssetName(animation, frameIndex)
  return `/sprites/stark/${animation}/${name}.png`
}

export function framePaths(animation: SpriteAnimation): string[] {
  const { frames } = SPRITE_ANIMATION_DEFINITIONS[animation]
  return Array.from({ length: frames }, (_, i) => framePath(animation, i))
}

export function getAnimationDefinition(animation: SpriteAnimation): SpriteAnimationDefinition {
  return SPRITE_ANIMATION_DEFINITIONS[animation]
}
