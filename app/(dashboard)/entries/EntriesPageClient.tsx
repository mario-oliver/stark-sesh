'use client'

import Link from 'next/link'
import { Plus, ClipboardList, ListTodo } from 'lucide-react'
import { useEffect, useState, useRef } from 'react'
import { useApiClient } from '@/hooks/use-api-client'
import type { Team } from '@/lib/api/endpoints/teams'
import { normalizeSession, type Session } from '@/lib/api/endpoints/sessions'
import { SESSION_TYPE_LABELS } from '@/lib/types'

interface EntriesPageClientProps {
  userId: string
}

export function EntriesPageClient({ userId }: EntriesPageClientProps) {
  const { apiClient, isReady } = useApiClient()

  const [teams, setTeams] = useState<Team[]>([])
  const [sessions, setSessions] = useState<Session[]>([])
  const [selectedTeamId, setSelectedTeamId] = useState<string | 'all'>('all')
  const hasFetchedTeams = useRef(false)
  const hasFetchedSessions = useRef(false)
  const [loadingTeams, setLoadingTeams] = useState(true)
  const [loadingSessions, setLoadingSessions] = useState(true)
  const [entriesTab, setEntriesTab] = useState<'sessions' | 'plans'>('sessions')

  // Load sessions for this user
  useEffect(() => {
    if (!isReady || !userId || hasFetchedSessions.current) return
    hasFetchedSessions.current = true
    apiClient
      .getSessions(userId)
      .then((res: { data?: { sessions?: Session[] } }) => {
        const raw = res.data?.sessions ?? []
        setSessions(raw.map(s => normalizeSession(s)))
      })
      .catch(() => setSessions([]))
      .finally(() => setLoadingSessions(false))
  }, [isReady, userId, apiClient])

  // Load teams
  useEffect(() => {
    if (!isReady || hasFetchedTeams.current) return
    hasFetchedTeams.current = true
    apiClient
      .listTeams()
      .then((res: { data?: { teams?: Team[] } }) => {
        setTeams((res.data?.teams ?? []) as Team[])
      })
      .catch(() => setTeams([]))
      .finally(() => setLoadingTeams(false))
  }, [isReady, apiClient])

  const filteredSessions =
    selectedTeamId === 'all' ? sessions : sessions.filter(session => session.teamId === selectedTeamId)

  const practiceSessions = filteredSessions.filter(s => s.type === 'TEAM_PRACTICE')

  return (
    <div className="min-h-screen bg-[#0c0c0c] text-zinc-100 safe-bottom">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
        <div className="mb-6 sm:mb-8">
          <h1 className="text-xl sm:text-3xl font-bold tracking-tight">Entries</h1>
          <p className="text-zinc-500 mt-1 text-sm sm:text-base">
            View sessions and observations, open practice plans, and track game stats by voice for game sessions.
          </p>
        </div>

        <div className="flex gap-2 mb-6 p-1 rounded-xl bg-zinc-900/50 border border-zinc-800">
          <button
            type="button"
            onClick={() => setEntriesTab('sessions')}
            className={`flex-1 min-h-[44px] rounded-lg px-3 py-2.5 text-sm font-medium touch-target inline-flex items-center justify-center gap-2 ${
              entriesTab === 'sessions'
                ? 'bg-zinc-800 text-primary-brand shadow-sm'
                : 'text-zinc-400 active:text-zinc-200'
            }`}
          >
            <ClipboardList className="w-4 h-4 shrink-0" />
            Sessions
          </button>
          <button
            type="button"
            onClick={() => setEntriesTab('plans')}
            className={`flex-1 min-h-[44px] rounded-lg px-3 py-2.5 text-sm font-medium touch-target inline-flex items-center justify-center gap-2 ${
              entriesTab === 'plans'
                ? 'bg-zinc-800 text-primary-brand shadow-sm'
                : 'text-zinc-400 active:text-zinc-200'
            }`}
          >
            <ListTodo className="w-4 h-4 shrink-0" />
            Practice plans
          </button>
        </div>

        <Link
          href="/create"
          className="flex items-center gap-4 rounded-2xl border border-zinc-700 bg-zinc-900/40 p-5 sm:p-6 text-left active:border-primary-brand/50 active:bg-zinc-800/50 transition-colors group w-full min-h-[72px] touch-target"
        >
          <span className="flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 rounded-xl bg-primary-brand/20 text-primary-brand group-active:bg-primary-brand/30 transition-colors shrink-0">
            <Plus className="w-7 h-7 sm:w-8 sm:h-8" />
          </span>
          <div className="flex-1 min-w-0">
            <h2 className="text-base sm:text-lg font-semibold text-zinc-100">Create entry</h2>
            <p className="text-sm text-zinc-500 mt-0.5">
              Pick an event, add who’s there, then record observations for the day.
            </p>
          </div>
          <span className="text-zinc-500 group-active:text-primary-brand transition-colors shrink-0">→</span>
        </Link>

        <div className="mt-8 sm:mt-10">
          <h2 className="text-sm font-medium text-zinc-400 uppercase tracking-wider mb-3">Teams</h2>

          {loadingTeams ? (
            <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-5 sm:p-6 text-sm text-zinc-500 min-h-[44px]">
              Loading teams...
            </div>
          ) : teams.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-zinc-700 bg-zinc-900/20 p-5 sm:p-6 text-sm text-zinc-500 min-h-[44px]">
              No teams yet. Create an entry to add your first team.
            </div>
          ) : (
            <div className="flex gap-2 flex-wrap">
              <button
                type="button"
                onClick={() => setSelectedTeamId('all')}
                className={`min-h-[44px] px-4 py-3 rounded-full text-sm font-medium border touch-target ${
                  selectedTeamId === 'all'
                    ? 'bg-primary-brand/20 border-primary-brand text-primary-brand'
                    : 'border-zinc-700 text-zinc-400 active:border-zinc-500'
                }`}
              >
                All teams
              </button>
              {teams.map(team => (
                <button
                  key={team.id}
                  type="button"
                  onClick={() => setSelectedTeamId(team.id)}
                  className={`min-h-[44px] px-4 py-3 rounded-full text-sm font-medium border touch-target ${
                    selectedTeamId === team.id
                      ? 'bg-primary-brand/20 border-primary-brand text-primary-brand'
                      : 'border-zinc-700 text-zinc-400 active:border-zinc-500'
                  }`}
                >
                  {team.name || 'Untitled team'}
                </button>
              ))}
            </div>
          )}

          {!loadingTeams && teams.length > 0 && (
            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-2">
              {teams.map(team => (
                <Link
                  key={`manage-${team.id}`}
                  href={`/teams/${team.id}`}
                  className="min-h-[52px] rounded-xl border border-zinc-800 bg-zinc-900/30 px-3 py-3 flex items-center justify-between active:border-zinc-600 active:bg-zinc-800/40 transition-colors"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-zinc-100 truncate">{team.name || 'Untitled team'}</p>
                    <p className="text-xs text-zinc-500">{team.members.length} players</p>
                  </div>
                  <span className="text-xs text-primary-brand shrink-0">Manage</span>
                </Link>
              ))}
            </div>
          )}
        </div>

        {entriesTab === 'sessions' && (
          <div className="mt-6 sm:mt-8">
            <h2 className="text-sm font-medium text-zinc-400 uppercase tracking-wider mb-3">Past sessions</h2>
            {loadingSessions ? (
              <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-5 sm:p-6 text-sm text-zinc-500 min-h-[44px]">
                Loading sessions...
              </div>
            ) : filteredSessions.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-zinc-700 bg-zinc-900/20 p-8 sm:p-12 text-center">
                <div className="w-12 h-12 rounded-xl bg-zinc-800 flex items-center justify-center mx-auto mb-3 text-zinc-500">
                  <ClipboardList className="w-6 h-6" />
                </div>
                <p className="text-zinc-500 text-sm">
                  {sessions.length === 0
                    ? 'Your past sessions will appear here. Create an entry to get started.'
                    : 'No sessions for this team yet. Try another team or create a new entry.'}
                </p>
              </div>
            ) : (
              <ul className="space-y-2 sm:space-y-3">
                {filteredSessions.map(session => {
                  const team = teams.find(t => t.id === session.teamId)
                  return (
                    <li key={session.id}>
                      <Link
                        href={`/sessions/${session.id}`}
                        className="flex items-center justify-between gap-3 rounded-2xl border border-zinc-800 bg-zinc-900/40 px-4 py-4 min-h-[56px] active:border-zinc-600 active:bg-zinc-800/50 transition-colors"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="text-sm sm:text-base font-medium text-zinc-100 truncate">
                            {team?.name || 'Untitled team'} • {SESSION_TYPE_LABELS[session.type]}
                          </p>
                          <p className="text-xs text-zinc-500 mt-0.5">
                            {new Date(session.startedAt).toLocaleString(undefined, {
                              dateStyle: 'medium',
                              timeStyle: 'short'
                            })}
                          </p>
                          {session.type === 'GAME' && (
                            <p className="text-[11px] text-primary-brand/80 mt-1">
                              Includes Stats tab (voice to auto-save player box score)
                            </p>
                          )}
                        </div>
                        <span className="text-sm font-medium text-primary-brand shrink-0">View →</span>
                      </Link>
                    </li>
                  )
                })}
              </ul>
            )}
          </div>
        )}

        {entriesTab === 'plans' && (
          <div className="mt-8 sm:mt-10">
            <h2 className="text-sm font-medium text-zinc-400 uppercase tracking-wider mb-3">Practice sessions</h2>
            <p className="text-sm text-zinc-500 mb-4">
              Open a session and use the <span className="text-zinc-300">Plan</span> tab to add objectives or generate a plan with AI (practice sessions only).
            </p>
            {loadingSessions ? (
              <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-5 sm:p-6 text-sm text-zinc-500 min-h-[44px]">
                Loading…
              </div>
            ) : practiceSessions.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-zinc-700 bg-zinc-900/20 p-8 sm:p-12 text-center">
                <p className="text-zinc-500 text-sm">
                  No team practice sessions yet. Create an entry with event type <span className="text-zinc-300">practice</span>, then return here.
                </p>
              </div>
            ) : (
              <ul className="space-y-2 sm:space-y-3">
                {practiceSessions.map(session => {
                  const team = teams.find(t => t.id === session.teamId)
                  return (
                    <li key={`plan-${session.id}`}>
                      <Link
                        href={`/sessions/${session.id}?tab=plan`}
                        className="flex items-center justify-between gap-3 rounded-2xl border border-zinc-800 bg-zinc-900/40 px-4 py-4 min-h-[56px] active:border-zinc-600 active:bg-zinc-800/50 transition-colors"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="text-sm sm:text-base font-medium text-zinc-100 truncate">
                            {team?.name || 'Untitled team'} · Practice plan
                          </p>
                          <p className="text-xs text-zinc-500 mt-0.5">
                            {new Date(session.startedAt).toLocaleString(undefined, {
                              dateStyle: 'medium',
                              timeStyle: 'short'
                            })}
                          </p>
                        </div>
                        <span className="text-sm font-medium text-primary-brand shrink-0">Plan →</span>
                      </Link>
                    </li>
                  )
                })}
              </ul>
            )}
          </div>
        )}

        <p className="text-center text-zinc-600 text-sm mt-8 sm:mt-10 safe-bottom">
          <Link href="/" className="inline-block py-3 min-h-[44px] touch-target text-zinc-400 active:text-zinc-300 underline">
            Back to home
          </Link>
        </p>
      </div>
    </div>
  )
}

