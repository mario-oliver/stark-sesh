'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { CampaignInputForm } from '@/components/campaign-funnel/CampaignInputForm'
import { CampaignLandingPageRenderer } from '@/components/campaign-funnel/CampaignLandingPageRenderer'
import { AgentWorkflowPanel } from '@/components/campaign-funnel/AgentWorkflowPanel'
import { VariantUrlsPanel } from '@/components/campaign-funnel/VariantUrlsPanel'
import type {
  CampaignLandingPage,
  MetaCampaignBrief,
  MetaCampaignInput,
  WorkflowStep
} from '@/lib/campaign-funnel/types'
import {
  fetchDefaultCampaignInput,
  runCampaignBrief,
  runCampaignVariants
} from '@/lib/api/endpoints/campaign-funnel'
import {
  getCampaign,
  saveCampaign,
  runCampaignIteration,
  type StoredCampaign,
  type VariantUrl
} from '@/lib/api/endpoints/campaigns'

const CREATE_STEPS: WorkflowStep[] = [
  { id: 'brief', label: '1. Meta Campaign Brief Agent', status: 'idle' },
  { id: 'content', label: '2. Content Experimentation Agent', status: 'idle' }
]

export type FunnelMode = 'create' | 'view' | 'optimize'

type Props = {
  mode: FunnelMode
  slug?: string
}

export function CampaignFunnelShell({ mode, slug }: Props) {
  const searchParams = useSearchParams()
  const effectiveMode: FunnelMode =
    mode === 'view' && searchParams.get('mode') === 'optimize' ? 'optimize' : mode

  const readOnly = effectiveMode === 'view' || effectiveMode === 'optimize'

  const [input, setInput] = useState<MetaCampaignInput | null>(null)
  const [brief, setBrief] = useState<MetaCampaignBrief | null>(null)
  const [page, setPage] = useState<CampaignLandingPage | null>(null)
  const [stored, setStored] = useState<StoredCampaign | null>(null)
  const [variantUrls, setVariantUrls] = useState<VariantUrl[]>([])
  const [selectedVariantId, setSelectedVariantId] = useState('variant-a')
  const [steps, setSteps] = useState<WorkflowStep[]>(CREATE_STEPS)
  const [running, setRunning] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [campaignMetricsText, setCampaignMetricsText] = useState('')
  const [webMetricsText, setWebMetricsText] = useState('')
  const [loadingCampaign, setLoadingCampaign] = useState(!!slug)

  const updateStep = useCallback((id: string, patch: Partial<WorkflowStep>) => {
    setSteps(prev => prev.map(s => (s.id === id ? { ...s, ...patch } : s)))
  }, [])

  useEffect(() => {
    if (slug) {
      setLoadingCampaign(true)
      getCampaign(slug)
        .then(c => {
          setStored(c)
          setInput(c.input)
          setBrief(c.brief)
          setPage(c.page)
          setVariantUrls(c.variantUrls)
          setSelectedVariantId(c.page.variants[0]?.id ?? 'variant-a')
          setSteps([
            { id: 'brief', label: '1. Meta Campaign Brief Agent', status: 'complete', output: c.brief },
            {
              id: 'content',
              label: '2. Content Experimentation Agent',
              status: 'complete',
              output: c.page
            }
          ])
        })
        .catch(e => setError(e instanceof Error ? e.message : 'Failed to load campaign'))
        .finally(() => setLoadingCampaign(false))
      return
    }

    fetchDefaultCampaignInput()
      .then(setInput)
      .catch(() =>
        setInput({
          campaignName: 'HoopReads Coach Growth Campaign',
          platform: 'Instagram',
          adFormat: 'Reels',
          targetAudience: 'High school basketball coaches',
          trafficObjective: 'Drive free trial signups',
          offer: 'AI-powered coaching insights from voice notes',
          adAngle: 'Save time after practice',
          primaryMetric: 'free_trial_signup_rate',
          secondaryMetrics: [],
          creativeHook:
            'Your best coaching notes are probably sitting unused in your phone.',
          brandTone: 'practical, coach-first, credible'
        })
      )
  }, [slug])

  const runAgents = async () => {
    if (!input || readOnly) return
    setRunning(true)
    setError(null)
    setBrief(null)
    setPage(null)
    setSteps(CREATE_STEPS)

    try {
      updateStep('brief', { status: 'running', input })
      const briefResult = await runCampaignBrief(input)
      setBrief(briefResult)
      updateStep('brief', { status: 'complete', output: briefResult })

      updateStep('content', { status: 'running', input: briefResult })
      const pageResult = await runCampaignVariants(briefResult)
      setPage(pageResult)
      setSelectedVariantId(pageResult.variants[0]?.id ?? 'variant-a')
      updateStep('content', { status: 'complete', output: pageResult })
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Agents failed'
      setError(msg)
      setSteps(prev =>
        prev.map(s => (s.status === 'running' ? { ...s, status: 'error', error: msg } : s))
      )
    } finally {
      setRunning(false)
    }
  }

  const handleSave = async (launch: boolean) => {
    if (!input || !brief || !page) return
    setSaving(true)
    setError(null)
    try {
      const record = await saveCampaign({
        input,
        brief,
        page,
        launch,
        existingSlug: stored?.slug ?? slug
      })
      setStored(record)
      setVariantUrls(record.variantUrls)
      setPage(record.page)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  const runIteration = async (launch: boolean) => {
    if (!slug || !brief) return
    setRunning(true)
    setError(null)
    try {
      const result = await runCampaignIteration(slug, {
        campaignMetricsText,
        webMetricsText,
        launch
      })
      setPage(result.page)
      setStored(result.campaign)
      setVariantUrls(result.campaign.variantUrls)
      setSelectedVariantId(result.page.variants[0]?.id ?? 'variant-iter-1')
      setSteps(prev => [
        ...prev,
        {
          id: 'iteration',
          label: '3. Performance Iteration Agent',
          status: 'complete',
          output: result.page
        }
      ])
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Iteration failed')
    } finally {
      setRunning(false)
    }
  }

  const selectedVariant = page?.variants.find(v => v.id === selectedVariantId) ?? page?.variants[0]
  const pageId = stored?.slug ?? slug ?? page?.pageId ?? 'preview'

  if (loadingCampaign) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center text-zinc-500">
        Loading campaign…
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-zinc-100">
      <header className="border-b border-zinc-800 px-6 py-4 flex flex-wrap items-start justify-between gap-2">
        <div>
          <h1 className="text-lg font-bold">Meta Campaign Funnel Orchestrator</h1>
          <p className="text-xs text-zinc-500 mt-1">
            {effectiveMode === 'create' && 'Create experiment → save & launch live variant URLs'}
            {effectiveMode === 'view' && `Viewing: ${stored?.campaignName ?? slug}`}
            {effectiveMode === 'optimize' &&
              `Iterate on: ${stored?.campaignName ?? slug} (gen ${stored?.experimentGeneration ?? 1})`}
          </p>
        </div>
        <div className="flex gap-2 text-xs">
          <Link href="/campaigns" className="text-primary-brand hover:underline">
            All campaigns
          </Link>
          {effectiveMode !== 'create' && (
            <Link href="/campaign-funnel" className="text-zinc-400 hover:text-zinc-200">
              Create experiment
            </Link>
          )}
        </div>
      </header>

      <div className="grid lg:grid-cols-12 gap-0 min-h-[calc(100vh-80px)]">
        <aside className="lg:col-span-3 border-r border-zinc-800 p-4 overflow-y-auto max-h-[calc(100vh-80px)]">
          {input && (
            <>
              <CampaignInputForm
                value={input}
                onChange={setInput}
                disabled={running || readOnly}
              />
              {effectiveMode === 'create' && (
                <button
                  type="button"
                  onClick={runAgents}
                  disabled={running}
                  className="mt-4 w-full bg-primary-brand hover:bg-primary-brand-hover disabled:opacity-50 text-white font-semibold rounded-lg py-2.5 text-sm transition-colors"
                >
                  {running ? 'Running agents…' : 'Run experiment and campaign agents'}
                </button>
              )}
              {page && !readOnly && (
                <div className="mt-3 flex flex-col gap-2">
                  <button
                    type="button"
                    onClick={() => handleSave(false)}
                    disabled={saving}
                    className="w-full border border-zinc-600 hover:border-zinc-500 text-zinc-200 font-medium rounded-lg py-2 text-sm transition-colors disabled:opacity-50"
                  >
                    Save draft
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSave(true)}
                    disabled={saving}
                    className="w-full bg-primary-brand hover:bg-primary-brand-hover disabled:opacity-50 text-white font-semibold rounded-lg py-2 text-sm transition-colors"
                  >
                    Save & launch
                  </button>
                </div>
              )}
              {(effectiveMode === 'view' || variantUrls.length > 0) && (
                <div className="mt-4">
                  <VariantUrlsPanel
                    variantUrls={variantUrls}
                    status={stored?.status ?? 'draft'}
                  />
                </div>
              )}
              {error && <p className="mt-2 text-xs text-red-400">{error}</p>}
            </>
          )}
        </aside>

        <main className="lg:col-span-5 border-r border-zinc-800 flex flex-col max-h-[calc(100vh-80px)]">
          <div className="flex gap-1 p-2 border-b border-zinc-800 shrink-0 overflow-x-auto">
            {page?.variants.map(v => (
              <button
                key={v.id}
                type="button"
                onClick={() => setSelectedVariantId(v.id)}
                className={`px-3 py-1.5 rounded-md text-xs font-medium whitespace-nowrap transition-colors ${
                  selectedVariantId === v.id
                    ? 'bg-primary-brand text-white'
                    : 'bg-zinc-800 text-zinc-400 hover:text-zinc-200'
                }`}
              >
                {v.name}
              </button>
            ))}
            {!page && (
              <span className="text-xs text-zinc-600 px-2 py-1.5">CMS preview</span>
            )}
          </div>
          <div className="flex-1 overflow-y-auto">
            {selectedVariant && page ? (
              <CampaignLandingPageRenderer
                variant={selectedVariant}
                campaignName={page.campaignName}
                pageId={pageId}
                experimentId={stored?.slug ?? 'orchestrator'}
              />
            ) : (
              <div className="flex items-center justify-center h-64 text-sm text-zinc-600">
                Landing page variants will render here
              </div>
            )}
          </div>
        </main>

        <aside className="lg:col-span-4 p-4 overflow-y-auto max-h-[calc(100vh-80px)]">
          <AgentWorkflowPanel steps={steps} />
        </aside>
      </div>

      {effectiveMode === 'optimize' && (
        <footer className="border-t border-zinc-800 p-6 space-y-4">
          <h3 className="text-sm font-semibold text-zinc-300">Performance iteration</h3>
          <p className="text-xs text-zinc-500">
            Paste real Meta campaign data and webpage analytics. The iteration agent uses your
            saved brief to generate 3 new variants.
          </p>
          <div className="grid md:grid-cols-2 gap-4">
            <label className="block">
              <span className="text-xs text-zinc-500">Campaign / Meta performance data</span>
              <textarea
                className="mt-1 w-full min-h-[140px] rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-200"
                value={campaignMetricsText}
                onChange={e => setCampaignMetricsText(e.target.value)}
                placeholder="Paste impressions, clicks, spend, signups per variant…"
              />
            </label>
            <label className="block">
              <span className="text-xs text-zinc-500">Webpage analytics data</span>
              <textarea
                className="mt-1 w-full min-h-[140px] rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-200"
                value={webMetricsText}
                onChange={e => setWebMetricsText(e.target.value)}
                placeholder="Paste bounce rate, CTA clicks, scroll depth, time on page…"
              />
            </label>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => runIteration(false)}
              disabled={running || !campaignMetricsText.trim()}
              className="border border-zinc-600 hover:border-zinc-500 text-zinc-200 font-medium rounded-lg py-2 px-4 text-sm disabled:opacity-50"
            >
              Run iteration agent
            </button>
            <button
              type="button"
              onClick={() => runIteration(true)}
              disabled={running || !page}
              className="bg-primary-brand hover:bg-primary-brand-hover text-white font-semibold rounded-lg py-2 px-4 text-sm disabled:opacity-50"
            >
              Save & launch new variants
            </button>
          </div>
        </footer>
      )}
    </div>
  )
}
