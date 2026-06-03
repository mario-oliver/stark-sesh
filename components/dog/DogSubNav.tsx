'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const links = (dogId: string) => [
  { href: `/dogs/${dogId}/today`, label: 'Today' },
  { href: `/dogs/${dogId}/tasks`, label: 'Tasks' },
  { href: `/dogs/${dogId}/calendar`, label: 'Calendar' },
  { href: `/dogs/${dogId}/history`, label: 'History' },
  { href: `/dogs/${dogId}/profile`, label: 'Profile' }
]

export function DogSubNav({ dogId }: { dogId: string }) {
  const pathname = usePathname()

  return (
    <nav className="flex flex-wrap gap-3 text-sm border-b border-zinc-800 pb-3 mb-6">
      {links(dogId).map(link => {
        const active = pathname === link.href || pathname.startsWith(`${link.href}/`)
        return (
          <Link
            key={link.href}
            href={link.href}
            className={
              active
                ? 'text-amber-400 font-medium'
                : 'text-zinc-500 hover:text-zinc-300 transition-colors'
            }
          >
            {link.label}
          </Link>
        )
      })}
    </nav>
  )
}
