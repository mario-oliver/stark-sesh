import { track } from '@vercel/analytics'

export type CampaignAnalyticsContext = {
  variant_id: string
  angle: string
  campaign_name: string
  page_id: string
  experiment_id?: string
}

type TrackProps = Record<string, string | number | boolean | null>

function toTrackProps(
  properties: CampaignAnalyticsContext & Record<string, unknown>
): TrackProps {
  const out: TrackProps = {}
  for (const [key, value] of Object.entries(properties)) {
    if (
      typeof value === 'string' ||
      typeof value === 'number' ||
      typeof value === 'boolean' ||
      value === null
    ) {
      out[key] = value
    } else if (value !== undefined) {
      out[key] = String(value)
    }
  }
  return out
}

function trackCampaignEvent(
  event: string,
  properties: CampaignAnalyticsContext & Record<string, unknown>
) {
  if (typeof window === 'undefined') return
  track(event, toTrackProps(properties))
}

export function trackLandingView(ctx: CampaignAnalyticsContext) {
  trackCampaignEvent('campaign_landing_view', ctx)
}

export function trackCtaClick(ctx: CampaignAnalyticsContext & { cta_text: string }) {
  trackCampaignEvent('campaign_cta_click', ctx)
}

export function trackScrollDepth(ctx: CampaignAnalyticsContext & { depth_pct: number }) {
  trackCampaignEvent('campaign_scroll_depth', { ...ctx, depth_pct: ctx.depth_pct })
}

export function trackSignupStart(ctx: CampaignAnalyticsContext) {
  trackCampaignEvent('campaign_signup_start', ctx)
}
