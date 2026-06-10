'use client'

import { useSpriteAnimation } from '@/lib/sprites/use-sprite-animation'
import { useSpriteSource } from '@/lib/sprites/SpriteSourceContext'
import { SPRITE_SIZE_PX, type StarkSpriteProps } from '@/lib/sprites/types'
import { cn } from '@/lib/utils'

export function StarkSprite({
  animation,
  size = 'medium',
  loop,
  animated,
  paused,
  className,
  onComplete
}: StarkSpriteProps) {
  const source = useSpriteSource()
  const { frameSrc } = useSpriteAnimation({
    animation,
    loop,
    animated,
    paused,
    onComplete,
    source
  })

  const dimension = SPRITE_SIZE_PX[size]

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={frameSrc}
      alt=""
      aria-hidden
      width={dimension}
      height={dimension}
      className={cn('object-contain', className)}
      style={{ width: dimension, height: dimension }}
    />
  )
}
