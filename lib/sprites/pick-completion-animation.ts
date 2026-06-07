import type { SpriteAnimation } from '@/lib/sprites/types'

const COMPLETION_ANIMATIONS: SpriteAnimation[] = ['sitA', 'sitB', 'playbow']

export function pickCompletionAnimation(seed: string): SpriteAnimation {
  let hash = 0
  for (let i = 0; i < seed.length; i += 1) {
    hash = (hash + seed.charCodeAt(i)) % COMPLETION_ANIMATIONS.length
  }
  return COMPLETION_ANIMATIONS[hash]!
}
