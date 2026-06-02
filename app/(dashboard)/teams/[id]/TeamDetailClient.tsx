'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Plus, Users, Pencil, Check, X } from 'lucide-react'
import { useApiClient } from '@/hooks/use-api-client'
import type { Team, TeamMemberRecord } from '@/lib/api/endpoints/teams'

interface TeamDetailClientProps {
  teamId: string
}

export function TeamDetailClient({ teamId }: TeamDetailClientProps) {
  const { apiClient, isReady } = useApiClient()
  const [team, setTeam] = useState<Team | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [number, setNumber] = useState('')
  const [name, setName] = useState('')
  const [adding, setAdding] = useState(false)
  const hasFetched = useRef(false)

  const [editingMemberId, setEditingMemberId] = useState<string | null>(null)
  const [editNumber, setEditNumber] = useState('')
  const [editName, setEditName] = useState('')
  const [savingMemberId, setSavingMemberId] = useState<string | null>(null)
  const [editAliases, setEditAliases] = useState('')

  useEffect(() => {
    if (!isReady || hasFetched.current) return
    hasFetched.current = true
    apiClient
      .getTeam(teamId)
      .then((res: { data?: { team?: Team } }) => {
        const t = res.data?.team
        if (!t) {
          setError('Team not found')
          return
        }
        setTeam(t)
      })
      .catch(() => setError('Failed to load team'))
      .finally(() => setLoading(false))
  }, [isReady, apiClient, teamId])

  const addPlayer = useCallback(async () => {
    if (!name.trim() && !number.trim()) {
      setError('Enter at least a name or number')
      return
    }
    setError(null)
    setAdding(true)
    try {
      const res = (await apiClient.addTeamMember(teamId, {
        number: number.trim(),
        name: name.trim()
      })) as { data?: { member?: TeamMemberRecord } }
      const member = res.data?.member
      if (!member) throw new Error('Could not add player')
      setTeam((prev) => (prev ? { ...prev, members: [...prev.members, member] } : prev))
      setNumber('')
      setName('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add player')
    } finally {
      setAdding(false)
    }
  }, [apiClient, teamId, number, name])

  const startEdit = useCallback((member: TeamMemberRecord) => {
    setEditingMemberId(member.id)
    setEditNumber(member.number)
    setEditName(member.name)
    setEditAliases((member.aliases ?? []).map(a => a.alias).join(', '))
  }, [])

  const cancelEdit = useCallback(() => {
    setEditingMemberId(null)
    setEditNumber('')
    setEditName('')
    setEditAliases('')
  }, [])

  const saveMember = useCallback(
    async (member: TeamMemberRecord) => {
      const nextNumber = editNumber.trim()
      const nextName = editName.trim()
      const nextAliases = editAliases
        .split(',')
        .map(x => x.trim())
        .filter(Boolean)
      if (!nextNumber && !nextName) return

      setSavingMemberId(member.id)
      try {
        const res = (await apiClient.updateTeamMember(teamId, member.id, {
          number: nextNumber,
          name: nextName,
          isActive: member.isActive,
          aliases: nextAliases
        })) as { data?: { member?: TeamMemberRecord } }

        const updated = res.data?.member
        if (!updated) throw new Error('Could not update player')

        setTeam(prev =>
          prev
            ? { ...prev, members: prev.members.map(m => (m.id === updated.id ? updated : m)) }
            : prev
        )
        cancelEdit()
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to save player')
      } finally {
        setSavingMemberId(null)
      }
    },
    [apiClient, teamId, editNumber, editName, editAliases, cancelEdit]
  )

  const setMemberActive = useCallback(
    async (member: TeamMemberRecord, nextIsActive: boolean) => {
      setError(null)
      setSavingMemberId(member.id)
      try {
        const res = (await apiClient.updateTeamMember(teamId, member.id, { isActive: nextIsActive })) as {
          data?: { member?: TeamMemberRecord }
        }
        const updated = res.data?.member
        if (!updated) throw new Error('Could not update player')

        setTeam(prev =>
          prev
            ? { ...prev, members: prev.members.map(m => (m.id === updated.id ? updated : m)) }
            : prev
        )

        if (!nextIsActive && editingMemberId === member.id) cancelEdit()
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to update player')
      } finally {
        setSavingMemberId(null)
      }
    },
    [apiClient, teamId, editingMemberId, cancelEdit]
  )

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0c0c0c] text-zinc-100 flex items-center justify-center">
        <p className="text-zinc-500">Loading team...</p>
      </div>
    )
  }

  if (!team) {
    return (
      <div className="min-h-screen bg-[#0c0c0c] text-zinc-100 flex flex-col items-center justify-center gap-4 px-6">
        <p className="text-red-400">{error ?? 'Team not found'}</p>
        <Link href="/entries" className="text-sm text-amber-400 hover:text-amber-300 underline">
          Back to entries
        </Link>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0c0c0c] text-zinc-100 safe-bottom">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
        <Link
          href="/entries"
          className="inline-flex items-center gap-2 text-sm text-zinc-500 active:text-zinc-300 mb-4 min-h-[44px] touch-target"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to entries
        </Link>

        <div className="mb-6">
          <p className="text-sm text-amber-400/90 font-medium uppercase tracking-wider">Team roster</p>
          <h1 className="text-xl sm:text-3xl font-bold tracking-tight mt-1">
            {team.name || 'Untitled team'}
          </h1>
          <p className="text-zinc-500 mt-1 text-sm">
            Manage players on this team. Changes apply to future sessions.
          </p>
        </div>

        {error && (
          <div className="mb-4 rounded-xl bg-red-400/10 border border-red-400/30 px-4 py-3">
            <p className="text-sm text-red-400">{error}</p>
          </div>
        )}

        <div className="rounded-xl border border-zinc-700/50 bg-zinc-900/30 overflow-hidden mb-6">
          <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider px-4 py-3 border-b border-zinc-700/50">
            Players ({team.members.length})
          </p>
          {team.members.length === 0 ? (
            <p className="px-4 py-6 text-zinc-500 text-sm text-center">
              No players yet. Add your first player below.
            </p>
          ) : (
            <ul className="divide-y divide-zinc-700/50">
              {team.members.map(m => {
                const isEditing = editingMemberId === m.id
                const isInactive = !m.isActive
                return (
                  <li key={m.id} className="px-4 py-3 min-h-[64px]">
                    {isEditing ? (
                      <div className="space-y-2">
                        <div className="flex gap-3 items-center">
                          <input
                            value={editNumber}
                            onChange={e => setEditNumber(e.target.value)}
                            placeholder="No."
                            className="w-20 min-h-[44px] rounded-xl border border-zinc-600 bg-zinc-800/50 px-3 py-2 text-base text-zinc-100 placeholder:text-zinc-500 focus:border-amber-500/50 focus:outline-none"
                            disabled={savingMemberId === m.id}
                          />
                          <input
                            value={editName}
                            onChange={e => setEditName(e.target.value)}
                            placeholder="Player name"
                            className="flex-1 min-w-0 min-h-[44px] rounded-xl border border-zinc-600 bg-zinc-800/50 px-4 py-2 text-base text-zinc-100 placeholder:text-zinc-500 focus:border-amber-500/50 focus:outline-none"
                            disabled={savingMemberId === m.id}
                          />
                        </div>
                        <input
                          value={editAliases}
                          onChange={e => setEditAliases(e.target.value)}
                          placeholder="Nicknames (comma-separated)"
                          className="w-full min-h-[44px] rounded-xl border border-zinc-600 bg-zinc-800/50 px-4 py-2 text-base text-zinc-100 placeholder:text-zinc-500 focus:border-amber-500/50 focus:outline-none"
                          disabled={savingMemberId === m.id}
                        />
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => saveMember(m)}
                            disabled={savingMemberId === m.id}
                            className="flex-1 min-h-[44px] rounded-xl bg-amber-500 active:bg-amber-400 disabled:opacity-50 text-black font-semibold inline-flex items-center justify-center gap-2 touch-target"
                          >
                            <Check className="w-4 h-4" />
                            {savingMemberId === m.id ? 'Saving…' : 'Save'}
                          </button>
                          <button
                            type="button"
                            onClick={cancelEdit}
                            disabled={savingMemberId === m.id}
                            className="flex-1 min-h-[44px] rounded-xl border border-zinc-600 text-zinc-300 active:bg-zinc-800/50 disabled:opacity-50 touch-target"
                          >
                            <span className="inline-flex items-center justify-center gap-2 w-full">
                              <X className="w-4 h-4" />
                              Cancel
                            </span>
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <span
                            className={`w-10 h-10 rounded-lg bg-zinc-800 text-zinc-300 flex items-center justify-center text-sm font-semibold shrink-0 ${
                              isInactive ? 'opacity-60' : ''
                            }`}
                          >
                            {m.number || '#'}
                          </span>
                          <div className="min-w-0">
                            <p className="text-zinc-100 text-sm sm:text-base truncate">
                              {m.name || 'Unnamed player'}
                            </p>
                            {isInactive && (
                              <p className="text-[11px] text-red-300 mt-0.5">Inactive</p>
                            )}
                            {(m.aliases ?? []).length > 0 && (
                              <p className="text-[11px] text-zinc-400 mt-0.5 truncate">
                                aka {(m.aliases ?? []).map(a => a.alias).join(', ')}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            type="button"
                            onClick={() => startEdit(m)}
                            className="min-h-[44px] min-w-[44px] rounded-xl p-0.5 border border-zinc-700 text-zinc-300 active:bg-zinc-800/50 touch-target"
                            title="Edit"
                            disabled={savingMemberId === m.id}
                          >
                            <Pencil className="w-4 h-4 mx-auto" />
                          </button>
                          {m.isActive ? (
                            <button
                              type="button"
                              onClick={() => setMemberActive(m, false)}
                              disabled={savingMemberId === m.id}
                              className="min-h-[44px] rounded-xl border border-red-500/40 px-3 text-sm text-red-300 active:bg-red-500/10 touch-target"
                            >
                              {savingMemberId === m.id ? '...' : 'Deactivate'}
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => setMemberActive(m, true)}
                              disabled={savingMemberId === m.id}
                              className="min-h-[44px] rounded-xl border border-emerald-500/40 px-3 text-sm text-emerald-300 active:bg-emerald-500/10 touch-target"
                            >
                              {savingMemberId === m.id ? '...' : 'Activate'}
                            </button>
                          )}
                        </div>
                      </div>
                    )}
                  </li>
                )
              })}
            </ul>
          )}
        </div>

        <div className="rounded-xl border border-zinc-700/50 bg-zinc-900/30 p-4 sm:p-5">
          <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-3">Add player</p>
          <div className="flex gap-3 mb-3">
            <input
              value={number}
              onChange={(e) => setNumber(e.target.value)}
              placeholder="No."
              className="w-20 min-h-[44px] rounded-xl border border-zinc-600 bg-zinc-800/50 px-3 py-2 text-base text-zinc-100 placeholder:text-zinc-500 focus:border-amber-500/50 focus:outline-none"
            />
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Player name"
              className="flex-1 min-w-0 min-h-[44px] rounded-xl border border-zinc-600 bg-zinc-800/50 px-4 py-2 text-base text-zinc-100 placeholder:text-zinc-500 focus:border-amber-500/50 focus:outline-none"
            />
          </div>
          <button
            type="button"
            onClick={addPlayer}
            disabled={adding}
            className="w-full min-h-[48px] rounded-xl bg-amber-500 active:bg-amber-400 disabled:opacity-50 text-black font-semibold inline-flex items-center justify-center gap-2 touch-target"
          >
            <Plus className="w-4 h-4" />
            {adding ? 'Adding...' : 'Add player'}
          </button>
        </div>

        <div className="mt-6 rounded-xl border border-zinc-800 bg-zinc-900/20 p-4 text-zinc-500 text-xs flex items-start gap-2">
          <Users className="w-4 h-4 mt-0.5 shrink-0" />
          <p>
            Tip: Team changes affect all future sessions. Existing session observations remain unchanged.
          </p>
        </div>
      </div>
    </div>
  )
}

