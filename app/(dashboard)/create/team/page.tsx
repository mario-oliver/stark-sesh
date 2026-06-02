import { Suspense } from 'react'
import CreateTeamContent from './CreateTeamContent'

function CreateTeamFallback() {
  return (
    <div className="min-h-screen bg-[#0c0c0c] text-zinc-100 flex items-center justify-center">
      <p className="text-zinc-500">Loading…</p>
    </div>
  )
}

export default function CreateTeamPage() {
  return (
    <Suspense fallback={<CreateTeamFallback />}>
      <CreateTeamContent />
    </Suspense>
  )
}
