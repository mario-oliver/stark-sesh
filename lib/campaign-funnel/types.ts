export type MetaCampaignInput = {
  campaignName: string
  platform: 'Instagram' | 'Facebook' | 'Meta'
  adFormat: string
  targetAudience: string
  trafficObjective: string
  offer: string
  adAngle: string
  primaryMetric: string
  secondaryMetrics: string[]
  creativeHook: string
  brandTone: string
}

export type MetaCampaignBrief = {
  campaignName: string
  platform: string
  adFormat: string
  audience: string
  objective: string
  primaryMetric: string
  adAngle: string
  creativeHook: string
  painPoints: string[]
  landingPagePromise: string
  messageHypothesis: string
  primaryCTA: string
  recommendedLandingPageEmphasis?: string
}

export type HeroBlock = { headline: string; subheadline: string; ctaText: string }
export type ProblemBlock = { title: string; items: string[] }
export type SolutionBlock = { title: string; body: string }
export type HowItWorksBlock = { steps: string[] }
export type ProofBlock = { title: string; body: string }
export type CTABlock = { headline: string; buttonText: string }
export type FAQBlock = { items: { question: string; answer: string }[] }

export type CampaignVariantBlocks = {
  hero: HeroBlock
  problem: ProblemBlock
  solution: SolutionBlock
  howItWorks: HowItWorksBlock
  proof: ProofBlock
  cta: CTABlock
  faq: FAQBlock
}

export type CampaignVariant = {
  id: string
  name: string
  angle: string
  hypothesis: string
  blocks: CampaignVariantBlocks
}

export type CampaignLandingPage = {
  pageId: string
  campaignName: string
  platform: 'Instagram' | 'Facebook' | 'Meta'
  template: 'CampaignLandingPage'
  variants: CampaignVariant[]
}

export type VariantPerformance = {
  variantId: string
  angle: string
  meta: {
    impressions: number
    clicks: number
    landingPageViews: number
    signups: number
    spend: number
    ctr: number
    lpViewRate: number
    signupRate: number
    costPerSignup: number
  }
  web: {
    pageViews: number
    uniqueVisitors: number
    bounceRate: number
    avgTimeOnPageSec: number
    scrollDepthP50: number
    ctaClickRate: number
    signupConversionRate: number
    webVitals?: { lcpMs?: number; cls?: number; inpMs?: number }
  }
}

export type CampaignPerformanceSnapshot = {
  campaignName: string
  platform: string
  period: string
  variants: VariantPerformance[]
}

export type OptimizerRecommendation = {
  winner: string
  winningAngle: string
  summary: string
  insights: string[]
  metricLayersCited?: ('meta' | 'web' | 'both')[]
  nextExperiment: {
    type: string
    reason: string
    variants: { name: string; cta?: string; headline?: string }[]
  }
  recommendedAction: string
  confidenceNote?: string
}

export type AgentStepStatus = 'idle' | 'running' | 'complete' | 'error'

export type WorkflowStep = {
  id: string
  label: string
  status: AgentStepStatus
  input?: unknown
  output?: unknown
  error?: string
}
