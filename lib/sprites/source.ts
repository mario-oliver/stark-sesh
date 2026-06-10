import type { SpriteAnimation } from '@/lib/sprites/types'
import { framePath } from '@/lib/sprites/animations'

export type SpriteManifestAnimationEntry = {
  frames: number
  fps: number
  loop: boolean
  keys: string[]
}

export type SpriteManifest = {
  styleVersion: string
  breed: string
  generatedAt: string
  animations: Partial<Record<SpriteAnimation, SpriteManifestAnimationEntry>>
}

export type SpriteSet = {
  id: string
  dogId: string
  isActive: boolean
  styleVersion: string
  storagePrefix: string
  manifest: SpriteManifest
  /** Base URL used to build frame request paths, e.g. https://api.stark.health/v1/dogs/{id}/sprites */
  frameBaseUrl: string
  createdAt: string
}

export type SpriteSource =
  | { kind: 'bundled' }
  | { kind: 'remote'; spriteSet: SpriteSet; frameUrl: (animation: SpriteAnimation, index: number) => string }

export const BUNDLED_SOURCE: SpriteSource = { kind: 'bundled' }

export function buildRemoteSource(spriteSet: SpriteSet): SpriteSource {
  return {
    kind: 'remote',
    spriteSet,
    frameUrl(animation: SpriteAnimation, index: number): string {
      const padded = String(index + 1).padStart(3, '0')
      return `${spriteSet.frameBaseUrl}/${animation}/${animation}_${padded}.png`
    }
  }
}

/**
 * Resolve the frame src for a given animation and frame index, using the
 * provided source (remote or bundled fallback).
 */
export function resolveFrameSrc(
  source: SpriteSource,
  animation: SpriteAnimation,
  frameIndex: number
): string {
  if (source.kind === 'remote') {
    const anim = source.spriteSet.manifest.animations[animation]
    if (anim && frameIndex < anim.frames) {
      return source.frameUrl(animation, frameIndex)
    }
    // Fall back to bundled if this animation isn't in the custom set
  }
  return framePath(animation, frameIndex)
}
