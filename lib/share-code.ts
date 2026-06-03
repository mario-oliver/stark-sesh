export function normalizeShareCode(input: string): string {
  return input.toUpperCase().replace(/[\s-]/g, '')
}

export function formatShareCode(code: string): string {
  const normalized = normalizeShareCode(code)
  if (normalized.length <= 4) return normalized
  return `${normalized.slice(0, 4)}-${normalized.slice(4)}`
}
