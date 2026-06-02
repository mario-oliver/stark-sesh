'use client'

import React, { useState, useEffect, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { EVENT_LABELS, eventTypeToSessionType, type EventType, type TeamMember } from '@/lib/types'
import { Plus, Trash2, User, Users } from 'lucide-react'
import { useApiClient } from '@/hooks/use-api-client'
import type { Team } from '@/lib/api/endpoints/teams'

function parseEvent(s: string | null): EventType {
  if (s && ['tryout', 'practice', 'game', 'scrimmage', 'other'].includes(s)) return s as EventType
  return 'practice'
}

export default function CreateTeamContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { apiClient, isReady } = useApiClient()
  const eventType = parseEvent(searchParams.get('event'))

  const [teams, setTeams] = useState<Team[]>([])
  const [loadingTeams, setLoadingTeams] = useState(true)
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null)
  const [useNewTeam, setUseNewTeam] = useState(false)
  const [newTeamName, setNewTeamName] = useState('')
  const [members, setMembers] = useState<TeamMember[]>([{ number: '', name: '' }])
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const hasFetchedTeams = useRef(false)

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

  const addMember = () => {
    setMembers(m => [...m, { number: '', name: '' }])
  }

  const removeMember = (index: number) => {
    setMembers(m => m.filter((_, i) => i !== index))
  }

  const updateMember = (index: number, field: 'number' | 'name', value: string) => {
    setMembers(m => {
      const next = [...m]
      next[index] = { ...next[index], [field]: value }
      return next
    })
  }

  const handleContinue = async () => {
    setError(null)
    setSubmitting(true)

    try {
      let teamId: string
      if (useNewTeam) {
        const team = members.filter(m => m.number.trim() || m.name.trim())
        const createRes = (await apiClient.createTeam({
          name: newTeamName.trim() || undefined,
          members: team.map(m => ({ number: m.number, name: m.name }))
        })) as { data?: { team?: { id: string } } }
        const id = createRes.data?.team?.id
        if (!id) throw new Error('Failed to create team')
        teamId = id
      } else if (selectedTeamId) {
        teamId = selectedTeamId
      } else {
        setError('Select a team or add a new one')
        setSubmitting(false)
        return
      }

      const sessionRes = (await apiClient.createSession({
        type: eventTypeToSessionType(eventType),
        teamId
      })) as { data?: { session?: { id: string } } }
      const sessionId = sessionRes.data?.session?.id
      if (!sessionId) throw new Error('Failed to create session')

      const params = new URLSearchParams()
      params.set('event', eventType)
      params.set('sessionId', sessionId)
      router.push(`/create/session?${params.toString()}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
      setSubmitting(false)
    }
  }

  const canContinue = !submitting && (selectedTeamId !== null || useNewTeam)

  return (
    <div className="min-h-screen bg-[#0c0c0c] text-zinc-100 safe-bottom">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
        {error && (
          <div className="mb-4 rounded-xl bg-red-400/10 border border-red-400/30 px-4 py-3">
            <p className="text-sm text-red-400">{error}</p>
          </div>
        )}
        <div className="mb-6 sm:mb-8">
          <p className="text-sm text-amber-400/90 font-medium uppercase tracking-wider">
            {EVENT_LABELS[eventType]}
          </p>
          <h1 className="text-xl sm:text-3xl font-bold tracking-tight mt-1">
            Which team is this for?
          </h1>
          <p className="text-zinc-500 mt-1 text-sm">
            Pick an existing team or create a new one. You can reuse teams across sessions.
          </p>
        </div>

        {/* Existing teams */}
        {!useNewTeam && (
          <div className="mb-6 sm:mb-8">
            <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-3">
              Existing teams
            </p>
            {loadingTeams ? (
              <p className="text-zinc-500 text-sm">Loading teams…</p>
            ) : teams.length === 0 ? (
              <p className="text-zinc-500 text-sm">No teams yet. Create one below.</p>
            ) : (
              <ul className="space-y-2">
                {teams.map(team => (
                  <li key={team.id}>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedTeamId(team.id)
                        setUseNewTeam(false)
                      }}
                      className={`flex items-center gap-3 w-full rounded-xl border p-4 min-h-[56px] text-left transition-colors touch-target ${
                        selectedTeamId === team.id
                          ? 'border-amber-500/50 bg-amber-500/10'
                          : 'border-zinc-700 bg-zinc-900/40 active:border-zinc-600'
                      }`}
                    >
                      <Users className="w-5 h-5 text-zinc-500 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <span className="font-medium text-zinc-100 text-sm sm:text-base">
                          {team.name || 'Unnamed team'}
                        </span>
                        <span className="text-zinc-500 text-sm ml-2">
                          {team.members?.length ?? 0} player{(team.members?.length ?? 0) === 1 ? '' : 's'}
                        </span>
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {/* Toggle: new team */}
        <div className="mb-6">
          <button
            type="button"
            onClick={() => {
              setUseNewTeam(!useNewTeam)
              if (!useNewTeam) setSelectedTeamId(null)
            }}
            className="min-h-[44px] inline-flex items-center text-sm text-amber-400 active:text-amber-300 py-2 touch-target"
          >
            {useNewTeam ? '← Back to existing teams' : '+ Create a new team'}
          </button>
        </div>

        {/* New team form */}
        {useNewTeam && (
          <>
            <div className="mb-4">
              <label className="block text-xs font-medium text-zinc-500 uppercase tracking-wider mb-2">
                Team name (optional)
              </label>
              <input
                type="text"
                placeholder="e.g. Varsity, JV"
                value={newTeamName}
                onChange={e => setNewTeamName(e.target.value)}
                className="w-full min-h-[48px] rounded-xl border border-zinc-600 bg-zinc-800/50 px-4 py-3 text-base text-zinc-100 placeholder:text-zinc-500 focus:border-amber-500/50 focus:outline-none focus:ring-1 focus:ring-amber-500/30"
              />
            </div>
            <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-3">
              Players
            </p>
            <div className="space-y-4 mb-4">
              {members.map((member, index) => (
                <div
                  key={index}
                  className="flex items-center gap-3 rounded-xl border border-zinc-700 bg-zinc-900/40 p-3"
                >
                  <span className="flex items-center justify-center w-10 h-10 rounded-lg bg-zinc-800 text-zinc-500 shrink-0">
                    <User className="w-5 h-5" />
                  </span>
                  <input
                    type="text"
                    placeholder="No."
                    value={member.number}
                    onChange={e => updateMember(index, 'number', e.target.value)}
                    className="w-16 min-h-[44px] rounded-xl border border-zinc-600 bg-zinc-800/50 px-3 py-2 text-zinc-100 placeholder:text-zinc-500 focus:border-amber-500/50 focus:outline-none text-base"
                  />
                  <input
                    type="text"
                    placeholder="Name"
                    value={member.name}
                    onChange={e => updateMember(index, 'name', e.target.value)}
                    className="flex-1 min-w-0 min-h-[44px] rounded-xl border border-zinc-600 bg-zinc-800/50 px-4 py-2 text-zinc-100 placeholder:text-zinc-500 focus:border-amber-500/50 focus:outline-none text-base"
                  />
                  <button
                    type="button"
                    onClick={() => removeMember(index)}
                    className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-zinc-500 active:text-red-400 active:bg-red-400/10 transition-colors touch-target"
                    title="Remove"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={addMember}
              className="flex items-center justify-center gap-2 w-full rounded-xl border border-dashed border-zinc-600 text-zinc-500 min-h-[48px] py-3 active:border-zinc-500 active:text-zinc-400 transition-colors mb-8 touch-target"
            >
              <Plus className="w-5 h-5" />
              Add player
            </button>
          </>
        )}

        <div className="flex flex-col sm:flex-row gap-3">
          <button
            type="button"
            onClick={handleContinue}
            disabled={!canContinue}
            className="flex-1 min-h-[48px] rounded-full bg-amber-500 active:bg-amber-400 disabled:opacity-50 disabled:cursor-not-allowed text-black font-semibold py-3 px-6 transition-colors touch-target"
          >
            {submitting ? 'Creating…' : 'Continue to observations'}
          </button>
          <Link
            href="/create"
            className="min-h-[48px] rounded-full border border-zinc-600 text-zinc-300 py-3 px-6 text-center font-medium active:border-zinc-500 flex items-center justify-center touch-target"
          >
            Back
          </Link>
        </div>

        <p className="text-center text-zinc-600 text-sm mt-8">
          <Link href="/entries" className="inline-block py-3 min-h-[44px] touch-target text-zinc-400 active:text-zinc-300 underline">
            Back to entries
          </Link>
        </p>
      </div>
    </div>
  )
}
