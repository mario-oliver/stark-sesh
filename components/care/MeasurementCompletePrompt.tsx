'use client'

import { Button } from '@/components/ui/button'

export function MeasurementCompletePrompt({
  title,
  description,
  onConfirm,
  onContinue,
  busy
}: {
  title: string
  description?: string
  onConfirm: () => void
  onContinue: () => void
  busy?: boolean
}) {
  return (
    <div className="mt-3 rounded-lg border border-primary/30 bg-primary/5 p-3 space-y-2">
      <p className="text-sm font-medium text-foreground">{title}</p>
      {description && <p className="text-xs text-muted-foreground">{description}</p>}
      <div className="flex flex-wrap gap-2">
        <Button type="button" size="sm" disabled={busy} onClick={onConfirm}>
          Mark done
        </Button>
        <Button type="button" variant="outline" size="sm" disabled={busy} onClick={onContinue}>
          Continue
        </Button>
      </div>
    </div>
  )
}
