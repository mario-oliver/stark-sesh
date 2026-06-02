'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { listCampaigns, type CampaignListItem } from '@/lib/api/endpoints/campaigns'

export function CampaignsPageClient() {
  const [campaigns, setCampaigns] = useState<CampaignListItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    listCampaigns()
      .then(setCampaigns)
      .catch(e => setError(e instanceof Error ? e.message : 'Failed to load'))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="min-h-screen bg-[#0c0c0c] text-zinc-100">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight">Campaigns</h1>
            <p className="text-sm text-zinc-500 mt-1">Saved experiments and live landing URLs</p>
          </div>
          <Link
            href="/campaign-funnel"
            className="bg-primary-brand hover:bg-primary-brand-hover text-white font-semibold rounded-lg px-4 py-2 text-sm transition-colors"
          >
            New experiment
          </Link>
        </div>

        {loading && <p className="text-zinc-500 text-sm">Loading…</p>}
        {error && <p className="text-red-400 text-sm">{error}</p>}

        {!loading && campaigns.length === 0 && (
          <p className="text-zinc-500 text-sm">No campaigns yet. Create your first experiment.</p>
        )}

        <ul className="space-y-3">
          {campaigns.map(c => (
            <li
              key={c.slug}
              className="rounded-lg border border-zinc-800 bg-zinc-900/40 p-4 flex flex-wrap items-center justify-between gap-3"
            >
              <div>
                <p className="font-medium text-zinc-100">{c.campaignName}</p>
                <p className="text-xs text-zinc-500 mt-1">
                  {c.status} · {c.variantCount} variants · gen {c.experimentGeneration} ·{' '}
                  {new Date(c.createdAt).toLocaleDateString()}
                </p>
              </div>
              <div className="flex gap-2 text-xs">
                <Link
                  href={`/campaign-funnel/${c.slug}`}
                  className="px-3 py-1.5 rounded-md bg-zinc-800 text-zinc-300 hover:text-white"
                >
                  View
                </Link>
                <Link
                  href={`/campaign-funnel/${c.slug}?mode=optimize`}
                  className="px-3 py-1.5 rounded-md bg-primary-brand/20 text-primary-brand hover:bg-primary-brand/30"
                >
                  Iterate
                </Link>
              </div>
            </li>
          ))}
        </ul>

        <p className="text-center text-zinc-600 text-sm mt-8">
          <Link href="/entries" className="text-zinc-400 hover:text-primary-brand underline">
            Back to entries
          </Link>
        </p>
      </div>
    </div>
  )
}
