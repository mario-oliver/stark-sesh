'use client'

import type { VariantUrl } from '@/lib/api/endpoints/campaigns'

export function VariantUrlsPanel({
  variantUrls,
  status
}: {
  variantUrls: VariantUrl[]
  status: string
}) {
  if (variantUrls.length === 0) {
    return (
      <div className="rounded-lg border border-zinc-700 bg-zinc-900/50 p-4 text-sm text-zinc-500">
        Launch the campaign to generate ad-ready URLs for each variant.
      </div>
    )
  }

  return (
    <div className="rounded-lg border border-primary-brand/30 bg-primary-brand/5 p-4 space-y-3">
      <p className="text-xs text-primary-brand/90 uppercase tracking-wide">
        Live variant URLs ({status})
      </p>
      <ul className="space-y-2">
        {variantUrls.map(v => (
          <li key={v.variantId} className="text-xs">
            <span className="text-zinc-400 font-medium">{v.variantId}</span>
            <a
              href={v.url}
              target="_blank"
              rel="noopener noreferrer"
              className="block mt-0.5 text-primary-brand hover:underline break-all"
            >
              {v.url}
            </a>
          </li>
        ))}
      </ul>
    </div>
  )
}
