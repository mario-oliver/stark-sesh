import type {
  CampaignLandingPage,
  MetaCampaignBrief,
  MetaCampaignInput
} from '@/lib/campaign-funnel/types'

export type CampaignStatus = 'draft' | 'launched'

export type VariantUrl = {
  variantId: string
  url: string
}

export type StoredCampaign = {
  slug: string
  campaignName: string
  status: CampaignStatus
  createdAt: string
  launchedAt?: string
  input: MetaCampaignInput
  brief: MetaCampaignBrief
  page: CampaignLandingPage
  variantUrls: VariantUrl[]
  experimentGeneration: number
}

export type CampaignListItem = {
  slug: string
  campaignName: string
  status: CampaignStatus
  createdAt: string
  launchedAt?: string
  variantCount: number
  experimentGeneration: number
}

const base = () => {
  const url = process.env.NEXT_PUBLIC_API_URL
  if (!url) throw new Error('NEXT_PUBLIC_API_URL is not defined')
  return url.replace(/\/$/, '')
}

async function post<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${base()}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  })
  const json = await res.json()
  if (!res.ok) throw new Error(json.message || `Request failed: ${res.status}`)
  return json.data as T
}

async function get<T>(path: string): Promise<T> {
  const res = await fetch(`${base()}${path}`)
  const json = await res.json()
  if (!res.ok) throw new Error(json.message || `Request failed: ${res.status}`)
  return json.data as T
}

export async function listCampaigns(): Promise<CampaignListItem[]> {
  return get<CampaignListItem[]>('/v1/campaigns')
}

export async function getCampaign(slug: string): Promise<StoredCampaign> {
  return get<StoredCampaign>(`/v1/campaigns/${encodeURIComponent(slug)}`)
}

export async function saveCampaign(payload: {
  input: MetaCampaignInput
  brief: MetaCampaignBrief
  page: CampaignLandingPage
  launch?: boolean
  existingSlug?: string
}): Promise<StoredCampaign> {
  return post<StoredCampaign>('/v1/campaigns', payload)
}

export async function runCampaignIteration(
  slug: string,
  payload: {
    campaignMetricsText: string
    webMetricsText: string
    launch?: boolean
  }
): Promise<{ page: CampaignLandingPage; campaign: StoredCampaign }> {
  return post(`/v1/campaigns/${encodeURIComponent(slug)}/iterate`, payload)
}
