import type { ReactNode } from 'react'

type MarketingHeroProps = {
  eyebrow?: string
  headline: ReactNode
  subheadline?: string
  children?: ReactNode
  className?: string
  align?: 'center' | 'left'
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

  return (
    <section className={`relative w-full min-h-[min(100vh,1080px)] overflow-hidden ${className}`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/stark.png" alt="" className="absolute inset-0 h-full w-full object-cover object-top" aria-hidden />
      <div className="absolute inset-0 bg-gradient-to-b from-black/35 via-black/0 to-[#0c0c0c]" aria-hidden />
      <div
        className={`relative z-10 max-w-5xl mx-auto px-6 sm:px-8 pt-16 pb-20 sm:pt-20 sm:pb-24 flex flex-col ${alignClass}`}
      >
        {eyebrow && (
          <p className="text-primary-brand/90 text-sm font-medium tracking-widest uppercase mb-4">{eyebrow}</p>
        )}
        <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-zinc-100 text-balance mb-6 max-w-4xl">
          {headline}
        </h1>
        {subheadline && <p className="text-lg sm:text-xl text-zinc-300 max-w-2xl text-balance mb-10">{subheadline}</p>}
        {children}
      </div>
    </section>
  )
}
