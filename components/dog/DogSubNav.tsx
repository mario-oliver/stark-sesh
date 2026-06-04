'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'

const links = (dogId: string) => [
  { href: `/dogs/${dogId}/today`, label: 'Today' },
  { href: `/dogs/${dogId}/calendar`, label: 'Calendar' }
]

export function DogSubNav({ dogId }: { dogId: string }) {
  const pathname = usePathname()

  return (
    <nav className="flex flex-wrap gap-2 text-sm border-b border-border pb-3 mb-6">
      {links(dogId).map(link => {
        const active = pathname === link.href || pathname.startsWith(`${link.href}/`)
        return (
          <Link
            key={link.href}
            href={link.href}
            className={cn(
              'rounded-full px-3 py-1.5 transition-colors',
              active
                ? 'bg-accent text-accent-foreground font-medium ring-1 ring-primary/25'
                : 'text-muted-foreground hover:bg-secondary hover:text-secondary-foreground'
            )}
          >
            {link.label}
          </Link>
        )
      })}
    </nav>
  )
}
