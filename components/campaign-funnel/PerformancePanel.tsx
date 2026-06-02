'use client'

import type { CampaignPerformanceSnapshot, OptimizerRecommendation } from '@/lib/campaign-funnel/types'

export function PerformancePanel({
  performance,
  recommendation
}: {
  performance: CampaignPerformanceSnapshot | null
  recommendation: OptimizerRecommendation | null
}) {
  if (!performance) {
    return (
      <div className="rounded-lg border border-zinc-700 bg-zinc-900/50 p-4 text-sm text-zinc-500">
        Run the pipeline to load mock Meta + web metrics.
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-sm font-semibold text-zinc-300 mb-3">
          Performance snapshot ({performance.period})
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-xs border-collapse">
            <thead>
              <tr className="text-zinc-500 border-b border-zinc-700">
                <th className="text-left py-2 pr-2">Variant</th>
                <th className="text-right py-2 px-1">Meta CTR</th>
                <th className="text-right py-2 px-1">Signup rate</th>
                <th className="text-right py-2 px-1">$/signup</th>
                <th className="text-right py-2 px-1">Bounce</th>
                <th className="text-right py-2 px-1">CTA click</th>
                <th className="text-right py-2 pl-1">Scroll P50</th>
              </tr>
            </thead>
            <tbody>
              {performance.variants.map(v => (
                <tr key={v.variantId} className="border-b border-zinc-800 text-zinc-300">
                  <td className="py-2 pr-2 font-medium">{v.variantId}</td>
                  <td className="text-right py-2 px-1">{(v.meta.ctr * 100).toFixed(1)}%</td>
                  <td className="text-right py-2 px-1">{(v.meta.signupRate * 100).toFixed(1)}%</td>
                  <td className="text-right py-2 px-1">${v.meta.costPerSignup.toFixed(0)}</td>
                  <td className="text-right py-2 px-1">{(v.web.bounceRate * 100).toFixed(0)}%</td>
                  <td className="text-right py-2 px-1">{(v.web.ctaClickRate * 100).toFixed(0)}%</td>
                  <td className="text-right py-2 pl-1">{v.web.scrollDepthP50}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {recommendation && (
        <div className="rounded-lg border border-primary-brand/30 bg-primary-brand/5 p-4">
          <p className="text-xs text-primary-brand/90 uppercase tracking-wide mb-1">Optimizer recommendation</p>
          <p className="text-sm font-semibold text-zinc-100 mb-2">
            Winner: {recommendation.winner} ({recommendation.winningAngle})
          </p>
          <p className="text-sm text-zinc-400 mb-3">{recommendation.summary}</p>
          <ul className="text-xs text-zinc-500 space-y-1 mb-3 list-disc pl-4">
            {recommendation.insights.map((insight, i) => (
              <li key={i}>{insight}</li>
            ))}
          </ul>
          <p className="text-xs text-zinc-400">
            <span className="text-zinc-300">Next test:</span> {recommendation.nextExperiment.type} —{' '}
            {recommendation.nextExperiment.reason}
          </p>
          <p className="text-xs text-primary-brand/80 mt-2">{recommendation.recommendedAction}</p>
        </div>
      )}
    </div>
  )
}
