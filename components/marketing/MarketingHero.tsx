'use client'

import { useCallback, useState, type PointerEvent, type ReactNode } from 'react'
import { StarkSprite } from '@/components/sprite/StarkSprite'
import type { SpriteAnimation } from '@/lib/sprites/types'
import { cn } from '@/lib/utils'

type MarketingHeroProps = {
  eyebrow?: string
  headline: ReactNode
  subheadline?: string
  children?: ReactNode
  className?: string
  align?: 'center' | 'left'
}

function ctaSpriteAnimation(target: EventTarget | null): SpriteAnimation {
  const button = (target as HTMLElement | null)?.closest<HTMLElement>('[data-slot=button]')
  if (!button) return 'run'

  return button.dataset.variant === 'default' ? 'run' : 'bark'
}

export function MarketingHero({
  eyebrow,
  headline,
  subheadline,
  children,
  className = '',
  align = 'center'
}: MarketingHeroProps) {
  const alignClass = align === 'center' ? 'text-center items-center' : 'text-left items-start'
  const [spriteAnimation, setSpriteAnimation] = useState<SpriteAnimation>('idle')

  const handleCtaPointerOver = useCallback((event: PointerEvent<HTMLDivElement>) => {
    setSpriteAnimation(ctaSpriteAnimation(event.target))
  }, [])

  const handleCtaPointerLeave = useCallback(() => {
    setSpriteAnimation('idle')
  }, [])

  return (
    <section className={cn('relative w-full min-h-[min(100vh,1080px)] overflow-hidden', className)}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/stark.png" alt="" className="absolute inset-0 h-full w-full object-cover object-top" aria-hidden />
      <div className="absolute inset-0 bg-linear-to-b from-black/50 via-black/15 to-black/85" aria-hidden />
      <div
        className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_100%,rgba(15,23,42,0.75),transparent)]"
        aria-hidden
      />
      <div
        className={cn(
          'relative z-10 max-w-5xl mx-auto px-6 sm:px-8 pt-16 pb-20 sm:pt-20 sm:pb-24 flex flex-col',
          alignClass
        )}
      >
        {eyebrow && <p className="text-sky-200/90 text-sm font-medium tracking-widest uppercase mb-4">{eyebrow}</p>}
        <div className={cn('pointer-events-none mb-4', align === 'center' && 'flex justify-center')}>
          <StarkSprite animation={spriteAnimation} size="large" />
        </div>
        <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-white text-balance mb-6 max-w-4xl [&_.text-primary]:text-sky-300">
          {headline}
        </h1>
        {subheadline && <p className="text-lg sm:text-xl text-white/75 max-w-2xl text-balance mb-10">{subheadline}</p>}
        {children && (
          <div
            className="rounded-2xl border border-white/10 bg-black/40 px-6 py-5 shadow-xl backdrop-blur-md [&_[data-variant=outline]]:border-white/30 [&_[data-variant=outline]]:bg-white/10 [&_[data-variant=outline]]:text-white [&_[data-variant=outline]]:hover:bg-white/20 [&_[data-variant=ghost]]:text-white/90 [&_[data-variant=ghost]]:hover:bg-white/10 [&_[data-variant=ghost]]:hover:text-white"
            onPointerOver={handleCtaPointerOver}
            onPointerLeave={handleCtaPointerLeave}
            onFocusCapture={(event) => setSpriteAnimation(ctaSpriteAnimation(event.target))}
            onBlurCapture={(event) => {
              if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
                setSpriteAnimation('idle')
              }
            }}
          >
            {children}
          </div>
        )}
      </div>
    </section>
  )
}
