import type {
  CampaignLandingPage,
  CampaignPerformanceSnapshot,
  MetaCampaignBrief,
  MetaCampaignInput,
  OptimizerRecommendation
} from '@/lib/campaign-funnel/types'

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

export async function fetchDefaultCampaignInput(): Promise<MetaCampaignInput> {
  return get<MetaCampaignInput>('/v1/campaign-funnel/defaults')
}

export async function runCampaignBrief(input: MetaCampaignInput): Promise<MetaCampaignBrief> {
  return post<MetaCampaignBrief>('/v1/campaign-funnel/brief', input)
}

export async function runCampaignVariants(brief: MetaCampaignBrief): Promise<CampaignLandingPage> {
  return post<CampaignLandingPage>('/v1/campaign-funnel/variants', brief)
}

export async function fetchPerformance(pageId: string, campaignName?: string): Promise<CampaignPerformanceSnapshot> {
  const q = campaignName ? `?campaignName=${encodeURIComponent(campaignName)}` : ''
  return get<CampaignPerformanceSnapshot>(`/v1/campaign-funnel/performance/${pageId}${q}`)
}

export async function runOptimizer(
  page: CampaignLandingPage,
  performance: CampaignPerformanceSnapshot
): Promise<OptimizerRecommendation> {
  return post<OptimizerRecommendation>('/v1/campaign-funnel/optimize', { page, performance })
}

export async function runFullCampaignPipeline(input: MetaCampaignInput): Promise<{
  brief: MetaCampaignBrief
  page: CampaignLandingPage
  performance: CampaignPerformanceSnapshot
  recommendation: OptimizerRecommendation
}> {
  return post('/v1/campaign-funnel/run', input)
}
