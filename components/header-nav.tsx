'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import { useApiClient } from '@/hooks/use-api-client'
import type { DogRecord } from '@/lib/api/endpoints/dogs'
import { getActiveDogId, setActiveDogId } from '@/lib/active-dog'
import { cn } from '@/lib/utils'

function currentDogIdFromPath(pathname: string): string | null {
  const match = pathname.match(/^\/dogs\/([^/]+)/)
  return match?.[1] ?? null
}

export function DogSwitcher() {
  const pathname = usePathname()
  const router = useRouter()
  const { apiClient, isReady } = useApiClient()
  const [dogs, setDogs] = useState<DogRecord[]>([])

  useEffect(() => {
    if (!isReady) return
    void apiClient.listDogs().then(res => setDogs(res.data))
  }, [apiClient, isReady])

  if (dogs.length <= 1) return null

  const pathDogId = currentDogIdFromPath(pathname)
  const activeId = pathDogId ?? getActiveDogId() ?? dogs[0]?.id
  const activeDog = dogs.find(d => d.id === activeId) ?? dogs[0]

  const switchDog = (newDogId: string) => {
    setActiveDogId(newDogId)
    const match = pathname.match(/^\/dogs\/[^/]+(\/.*)?$/)
    const suffix = match?.[1] ?? '/today'
    router.push(`/dogs/${newDogId}${suffix}`)
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1 max-w-[120px] sm:max-w-[160px]">
          <span className="truncate">{activeDog.name}</span>
          <ChevronDown className="size-3.5 shrink-0 opacity-60" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {dogs.map(dog => (
          <DropdownMenuItem
            key={dog.id}
            onClick={() => switchDog(dog.id)}
            className={dog.id === activeId ? 'font-medium' : undefined}
          >
            {dog.name}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

function navLinkClass(active: boolean) {
  return cn(
    'rounded-md px-2 py-1 text-sm font-medium transition-colors',
    active
      ? 'bg-accent text-accent-foreground'
      : 'text-muted-foreground hover:text-accent-foreground hover:bg-accent/60'
  )
}

export function HeaderNav() {
  const pathname = usePathname()

  const isCare =
    pathname === '/today' ||
    pathname === '/calendar' ||
    pathname.includes('/today') ||
    pathname.includes('/calendar')
  const isExercises = pathname === '/exercises' || pathname === '/tasks' || pathname.includes('/tasks')
  const isProfile = pathname === '/profile' || pathname.includes('/profile')
  const isHistory = pathname === '/history' || pathname.includes('/history')

  return (
    <>
      <Link href="/today" className={navLinkClass(isCare)}>
        Care
      </Link>
      <Link href="/exercises" className={navLinkClass(isExercises)}>
        Exercises
      </Link>
      <Link href="/profile" className={navLinkClass(isProfile)}>
        Profile
      </Link>
      <Link href="/history" className={navLinkClass(isHistory)}>
        History
      </Link>
      <DogSwitcher />
    </>
  )
}
