'use client'

import type { WorkflowStep } from '@/lib/campaign-funnel/types'

export function AgentWorkflowPanel({ steps }: { steps: WorkflowStep[] }) {
  return (
    <div className="space-y-4">
      <h2 className="text-sm font-semibold text-zinc-300">Agent workflow</h2>
      {steps.map(step => (
        <div
          key={step.id}
          className="rounded-lg border border-zinc-700 bg-zinc-900/60 overflow-hidden"
        >
          <div className="flex items-center justify-between px-3 py-2 border-b border-zinc-800 bg-zinc-800/40">
            <span className="text-xs font-medium text-zinc-200">{step.label}</span>
            <StatusBadge status={step.status} />
          </div>
          {step.input !== undefined && (
            <details className="px-3 py-2 border-b border-zinc-800/50">
              <summary className="text-xs text-zinc-500 cursor-pointer">Input</summary>
              <pre className="text-[10px] text-zinc-500 mt-1 overflow-auto max-h-32">
                {JSON.stringify(step.input, null, 2)}
              </pre>
            </details>
          )}
          {step.output !== undefined && (
            <details className="px-3 py-2" open={step.status === 'complete'}>
              <summary className="text-xs text-zinc-500 cursor-pointer">Output</summary>
              <pre className="text-[10px] text-zinc-400 mt-1 overflow-auto max-h-48">
                {JSON.stringify(step.output, null, 2)}
              </pre>
            </details>
          )}
          {step.error && (
            <p className="px-3 py-2 text-xs text-red-400">{step.error}</p>
          )}
        </div>
      ))}
    </div>
  )
}

function StatusBadge({ status }: { status: WorkflowStep['status'] }) {
  const styles: Record<WorkflowStep['status'], string> = {
    idle: 'bg-zinc-700 text-zinc-400',
    running: 'bg-primary-brand/20 text-primary-brand',
    complete: 'bg-emerald-500/20 text-emerald-400',
    error: 'bg-red-500/20 text-red-400'
  }
  return (
    <span className={`text-[10px] uppercase px-2 py-0.5 rounded-full ${styles[status]}`}>
      {status}
    </span>
  )
}
