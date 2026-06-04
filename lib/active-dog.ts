const STORAGE_KEY = 'stark-active-dog-id'

export function getActiveDogId(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem(STORAGE_KEY)
}

export function setActiveDogId(id: string) {
  if (typeof window === 'undefined') return
  localStorage.setItem(STORAGE_KEY, id)
}

export function resolveDogId(dogs: { id: string }[]): string {
  if (dogs.length === 0) throw new Error('No dogs available')
  const active = getActiveDogId()
  if (active && dogs.some(d => d.id === active)) return active
  return dogs[0].id
}
