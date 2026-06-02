import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { EVENT_LABELS, type EventType } from '@/lib/types'
import { ClipboardList, Gamepad, Target, Users, Zap } from 'lucide-react'

const EVENT_OPTIONS: { type: EventType; icon: React.ReactNode; description: string }[] = [
  { type: 'tryout', icon: <Target className="w-5 h-5" />, description: 'Evaluate players' },
  { type: 'practice', icon: <Zap className="w-5 h-5" />, description: 'Drills and reps' },
  { type: 'game', icon: <Gamepad className="w-5 h-5" />, description: 'Live game' },
  { type: 'scrimmage', icon: <Users className="w-5 h-5" />, description: 'Controlled scrimmage' },
  { type: 'other', icon: <ClipboardList className="w-5 h-5" />, description: 'Other session' }
]

export default async function CreateEntryPage() {
  const { userId } = await auth()
  if (!userId) redirect('/sign-in?redirect_url=/create')

  return (
    <div className="min-h-screen bg-[#0c0c0c] text-zinc-100">
      <div className="max-w-2xl mx-auto px-6 sm:px-8 py-10">
        <div className="mb-10">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Create entry</h1>
          <p className="text-zinc-500 mt-1">
            Start by choosing today’s event. Then add who’s there and capture observations.
          </p>
        </div>

        <p className="text-sm font-medium text-zinc-400 uppercase tracking-wider mb-4">What type of event is this?</p>
        <ul className="space-y-3">
          {EVENT_OPTIONS.map(({ type, icon, description }) => (
            <li key={type}>
              <Link
                href={`/create/team?event=${encodeURIComponent(type)}`}
                className="flex items-center gap-4 rounded-xl border border-zinc-700 bg-zinc-900/40 p-4 text-left hover:border-amber-500/50 hover:bg-zinc-800/50 transition-colors group"
              >
                <span className="flex items-center justify-center w-11 h-11 rounded-lg bg-zinc-800 text-amber-400 group-hover:bg-amber-500/20 transition-colors">
                  {icon}
                </span>
                <div className="flex-1 min-w-0">
                  <span className="font-semibold text-zinc-100">{EVENT_LABELS[type]}</span>
                  <p className="text-sm text-zinc-500 mt-0.5">{description}</p>
                </div>
                <span className="text-zinc-500 group-hover:text-amber-400 transition-colors">→</span>
              </Link>
            </li>
          ))}
        </ul>

        <p className="text-center text-zinc-600 text-sm mt-10">
          <Link href="/entries" className="hover:text-zinc-400 underline">
            Back to entries
          </Link>
        </p>
      </div>
    </div>
  )
}
