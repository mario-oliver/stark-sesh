'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { DogSubNav } from '@/components/dog/DogSubNav'
import { SpriteOverlay } from '@/components/sprite/SpriteOverlay'
import { useApiClient } from '@/hooks/use-api-client'
import { useActiveDog } from '@/hooks/use-active-dog'

export function HistoryClient({ dogId }: { dogId: string }) {
  const { apiClient, isReady } = useApiClient()
  useActiveDog(dogId)
  const [logs, setLogs] = useState<
    Array<{
      id: string
      date: string
      summary: string | null
      completedCount: number
      totalActions: number
    }>
  >([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!isReady) return
    setLoading(true)
    void apiClient
      .getHistory(dogId)
      .then(res => setLogs(res.data.logs))
      .finally(() => setLoading(false))
  }, [apiClient, isReady, dogId])

  function dateParam(dateStr: string) {
    const d = new Date(dateStr)
    const y = d.getUTCFullYear()
    const m = String(d.getUTCMonth() + 1).padStart(2, '0')
    const day = String(d.getUTCDate()).padStart(2, '0')
    return `${y}-${m}-${day}`
  }

  return (
    <div className="min-h-screen bg-background text-foreground pb-12">
      <div className="max-w-lg mx-auto px-4 pt-6">
        <Link href="/today" className="text-sm text-primary hover:text-primary/80 underline">
          ← Care
        </Link>

        <header className="mt-4 mb-2">
          <p className="text-xs uppercase tracking-widest text-accent-foreground font-medium">Care</p>
          <h1 className="text-2xl font-semibold mt-1">History</h1>
          <p className="text-sm text-muted-foreground mt-1">Past daily care logs</p>
        </header>

        <DogSubNav dogId={dogId} />

        {loading ? (
          <SpriteOverlay preset="dailyPlanLoading" mode="inline" size="small" className="py-12" />
        ) : (
        <ul className="space-y-3">
          {logs.map(log => (
            <li key={log.id}>
              <Link
                href={`/dogs/${dogId}/calendar?date=${dateParam(log.date)}`}
                className="block border border-border rounded-lg p-4 bg-card hover:border-primary/50 transition-colors"
              >
                <p className="font-medium">{new Date(log.date).toLocaleDateString()}</p>
                <p className="text-sm text-muted-foreground mt-1">
                  {log.completedCount}/{log.totalActions} exercises
                </p>
                {log.summary && <p className="text-sm text-muted-foreground mt-2">{log.summary}</p>}
              </Link>
            </li>
          ))}
          {logs.length === 0 && <SpriteOverlay preset="emptyState" mode="inline" size="small" />}
        </ul>
        )}
      </div>
    </div>
  )
}
