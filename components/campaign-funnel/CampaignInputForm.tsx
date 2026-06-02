'use client'

import type { MetaCampaignInput } from '@/lib/campaign-funnel/types'

const FIELDS: { key: keyof MetaCampaignInput; label: string; multiline?: boolean }[] = [
  { key: 'campaignName', label: 'Campaign name' },
  { key: 'platform', label: 'Platform' },
  { key: 'adFormat', label: 'Ad format' },
  { key: 'targetAudience', label: 'Target audience' },
  { key: 'trafficObjective', label: 'Traffic objective' },
  { key: 'offer', label: 'Offer', multiline: true },
  { key: 'adAngle', label: 'Ad angle' },
  { key: 'primaryMetric', label: 'Primary metric' },
  { key: 'creativeHook', label: 'Creative hook', multiline: true },
  { key: 'brandTone', label: 'Brand tone' }
]

type Props = {
  value: MetaCampaignInput
  onChange: (v: MetaCampaignInput) => void
  disabled?: boolean
}

export function CampaignInputForm({ value, onChange, disabled }: Props) {
  const update = (key: keyof MetaCampaignInput, fieldValue: string) => {
    if (key === 'platform') {
      onChange({
        ...value,
        platform: fieldValue as MetaCampaignInput['platform']
      })
      return
    }
    onChange({ ...value, [key]: fieldValue })
  }

  return (
    <form className="space-y-3" onSubmit={e => e.preventDefault()}>
      <h2 className="text-sm font-semibold text-zinc-300 mb-2">Meta campaign input</h2>
      {FIELDS.map(({ key, label, multiline }) => (
        <label key={key} className="block">
          <span className="text-xs text-zinc-500">{label}</span>
          {multiline ? (
            <textarea
              className="mt-0.5 w-full rounded-md border border-zinc-700 bg-zinc-900 px-2 py-1.5 text-sm text-zinc-200 min-h-[60px]"
              value={String(value[key])}
              onChange={e => update(key, e.target.value)}
              disabled={disabled}
            />
          ) : (
            <input
              className="mt-0.5 w-full rounded-md border border-zinc-700 bg-zinc-900 px-2 py-1.5 text-sm text-zinc-200"
              value={String(value[key])}
              onChange={e => update(key, e.target.value)}
              disabled={disabled}
            />
          )}
        </label>
      ))}
    </form>
  )
}
