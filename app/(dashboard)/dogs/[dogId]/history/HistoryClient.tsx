'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { DogSubNav } from '@/components/dog/DogSubNav'
import { useApiClient } from '@/hooks/use-api-client'

export function HistoryClient({ dogId }: { dogId: string }) {
  const { apiClient, isReady } = useApiClient()
  const [logs, setLogs] = useState<
    Array<{
      id: string
      date: string
      summary: string | null
      completedCount: number
      totalActions: number
    }>
  >([])

  useEffect(() => {
    if (!isReady) return
    void apiClient.getHistory(dogId).then(res => setLogs(res.data.logs))
  }, [apiClient, isReady, dogId])

  function dateParam(dateStr: string) {
    const d = new Date(dateStr)
    const y = d.getUTCFullYear()
    const m = String(d.getUTCMonth() + 1).padStart(2, '0')
    const day = String(d.getUTCDate()).padStart(2, '0')
    return `${y}-${m}-${day}`
  }

  return (
    <div className="min-h-screen bg-[#0c0c0c] text-zinc-100 max-w-lg mx-auto px-4 py-8">
      <Link href="/today" className="text-sm text-amber-400 underline">
        ← Home
      </Link>
      <h1 className="text-2xl font-semibold mt-4">Care history</h1>

      <div className="mt-4">
        <DogSubNav dogId={dogId} />
      </div>

      <ul className="mt-6 space-y-3">
        {logs.map(log => (
          <li key={log.id}>
            <Link
              href={`/dogs/${dogId}/calendar?date=${dateParam(log.date)}`}
              className="block border border-zinc-800 rounded-lg p-4 hover:border-zinc-700 transition-colors"
            >
              <p className="font-medium">{new Date(log.date).toLocaleDateString()}</p>
              <p className="text-sm text-zinc-500 mt-1">
                {log.completedCount}/{log.totalActions} actions
              </p>
              {log.summary && <p className="text-sm text-zinc-400 mt-2">{log.summary}</p>}
            </Link>
          </li>
        ))}
        {logs.length === 0 && <p className="text-zinc-500">No past logs yet.</p>}
      </ul>
    </div>
  )
}
