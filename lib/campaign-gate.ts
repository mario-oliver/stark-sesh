export const CAMPAIGN_ACCESS_STORAGE_KEY = 'filmsesh-campaign-access'

/** Admin routes that require the campaign gate password (not public /campaign/* landings). */
export function isCampaignGatedPath(pathname: string): boolean {
  return pathname === '/campaigns' || pathname.startsWith('/campaign-funnel')
}

export function isCampaignAccessGranted(): boolean {
  if (typeof window === 'undefined') return false
  try {
    return sessionStorage.getItem(CAMPAIGN_ACCESS_STORAGE_KEY) === '1'
  } catch {
    return false
  }
}

export function grantCampaignAccess(): void {
  try {
    sessionStorage.setItem(CAMPAIGN_ACCESS_STORAGE_KEY, '1')
  } catch {
    // private mode / blocked storage
  }
}

export function getCampaignGatePassword(): string | undefined {
  const value = process.env.NEXT_PUBLIC_CAMPAIGN_GATE_PASSWORD
  if (value == null || value === '') return undefined
  return value.trim()
}

export function isCampaignGateEnabled(): boolean {
  return getCampaignGatePassword() !== undefined
}

export function checkCampaignGatePassword(input: string): boolean {
  const expected = getCampaignGatePassword()
  if (!expected) return true
  return input.trim() === expected
}

export function readInitialGateUnlocked(): boolean {
  if (typeof window === 'undefined') return false
  if (!isCampaignGateEnabled()) return true
  return isCampaignAccessGranted()
}
