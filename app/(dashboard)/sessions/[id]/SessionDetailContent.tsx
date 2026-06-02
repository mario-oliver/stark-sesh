'use client'

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { Mic, Square, ArrowLeft, Pencil, Check, X, Lock, Unlock } from 'lucide-react'
import { blobToWav } from '@/lib/audio-to-wav'
import { SESSION_TYPE_LABELS, type SessionType } from '@/lib/types'
import { useApiClient } from '@/hooks/use-api-client'
import type {
  Session,
  ObservationRecord,
  PracticePlanRecord,
  TeamMemberRecord,
  SessionPlayerStatRecord,
  DerivedStatLineRecord
} from '@/lib/api/endpoints/sessions'
import { buildPlayerObservationSections, normalizeSession } from '@/lib/api/endpoints/sessions'
import { PracticePlanPanel } from './PracticePlanPanel'

function buildTranscribePrompt(
  sessionType: SessionType,
  team: { number: string; name: string; aliases?: Array<{ alias: string }> }[]
): string {
  const parts = [
    'This transcript is about basketball coaching.',
    `Session type: ${SESSION_TYPE_LABELS[sessionType]}.`,
    'It may include coaching terms, plays, sets, player positions, and game strategy.'
  ]
  if (team.length > 0) {
    const roster = team
      .filter(m => m.number.trim() || m.name.trim())
      .map(m => `#${m.number} ${m.name}`.trim())
      .filter(Boolean)
    if (roster.length > 0) {
      parts.push(`Players present (number and name): ${roster.join(', ')}. Use these when referring to players.`)
      const aliases = team
        .flatMap(m => (m.aliases ?? []).map(a => `${m.name || m.number || 'Player'}=${a.alias}`))
        .slice(0, 40)
      if (aliases.length > 0) {
        parts.push(`Known player nicknames: ${aliases.join(', ')}.`)
      }
    }
  }
  return parts.join(' ')
}

interface SessionDetailContentProps {
  sessionId: string
}

const STAT_FIELDS = ['points', 'assists', 'rebounds', 'steals', 'blocks', 'turnovers', 'fouls'] as const
type StatField = (typeof STAT_FIELDS)[number]

export function SessionDetailContent({ sessionId }: SessionDetailContentProps) {
  const { apiClient, isReady } = useApiClient()
  const searchParams = useSearchParams()
  const router = useRouter()
  const tabParam = searchParams.get('tab')
  const [playerStats, setPlayerStats] = useState<SessionPlayerStatRecord[]>([])
  const [derivedLines, setDerivedLines] = useState<DerivedStatLineRecord[]>([])
  const [updatingStatKey, setUpdatingStatKey] = useState<string | null>(null)
  const [activeStatCell, setActiveStatCell] = useState<{ teamMemberId: string; field: StatField } | null>(
    null
  )
  const [activeStatValue, setActiveStatValue] = useState<string>('')
  const activeTab = tabParam === 'plan' ? 'plan' : tabParam === 'stats' ? 'stats' : 'observations'
  const setTab = useCallback(
    (t: 'observations' | 'plan' | 'stats') => {
      router.replace(`/sessions/${sessionId}?tab=${t}`)
    },
    [router, sessionId]
  )

  const [session, setSession] = useState<Session | null>(null)
  const [observations, setObservations] = useState<ObservationRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isRecording, setIsRecording] = useState(false)
  const [transcript, setTranscript] = useState<string | null>(null)
  const [transcribeError, setTranscribeError] = useState<string | null>(null)
  const [isTranscribing, setIsTranscribing] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editText, setEditText] = useState('')
  const [savingId, setSavingId] = useState<string | null>(null)
  const [recordDrillId, setRecordDrillId] = useState<string>('')
  const [playerSheetMemberId, setPlayerSheetMemberId] = useState<string>('')
  const [planDrillDraft, setPlanDrillDraft] = useState<string | null>(null)
  const [creatingDrillFromTranscript, setCreatingDrillFromTranscript] = useState(false)
  const [editingDerivedLineId, setEditingDerivedLineId] = useState<string | null>(null)
  const [derivedDraft, setDerivedDraft] = useState<Record<StatField, string>>({
    points: '0',
    assists: '0',
    rebounds: '0',
    steals: '0',
    blocks: '0',
    turnovers: '0',
    fouls: '0'
  })
  const [resolveMemberByLineId, setResolveMemberByLineId] = useState<Record<string, string>>({})
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const hasFetched = useRef(false)

  const showRecordBar = activeTab === 'observations' || activeTab === 'plan' || activeTab === 'stats'

  useEffect(() => {
    if (!isReady || !sessionId || hasFetched.current) return
    hasFetched.current = true
    apiClient
      .getSession(sessionId)
      .then((res: { data?: { session?: Session } }) => {
        const s = res.data?.session
        if (s) {
          const norm = normalizeSession(s)
          setSession(norm)
          setObservations(norm.observations)
          setPlayerStats(norm.playerStats)
          if (norm.type === 'GAME') {
            void apiClient
              .getSessionStats(sessionId)
              .then((statsRes: { data?: { stats?: SessionPlayerStatRecord[]; derivedLines?: DerivedStatLineRecord[] } }) => {
                if (statsRes.data?.stats) {
                  setPlayerStats(statsRes.data.stats)
                }
                if (statsRes.data?.derivedLines) {
                  setDerivedLines(statsRes.data.derivedLines)
                }
              })
              .catch(() => undefined)
          }
        } else {
          setError('Session not found')
        }
      })
      .catch(() => setError('Failed to load session'))
      .finally(() => setLoading(false))
  }, [isReady, sessionId, apiClient])

  const sessionType = session?.type ?? 'TEAM_PRACTICE'
  const team = useMemo(() => session?.team?.members ?? [], [session?.team?.members])
  const hasPendingProcessing = observations.some(
    o =>
      o.taggingStatus === 'PENDING' ||
      o.taggingStatus === 'PROCESSING' ||
      o.statStatus === 'PENDING' ||
      o.statStatus === 'PROCESSING'
  )

  const handlePlanUpdated = useCallback((plan: PracticePlanRecord) => {
    setSession(prev => (prev ? { ...prev, practicePlan: plan } : null))
  }, [])

  const refreshStats = useCallback(async () => {
    if (!isReady || !sessionId) return
    try {
      const res = (await apiClient.getSessionStats(sessionId)) as {
        data?: { stats?: SessionPlayerStatRecord[]; derivedLines?: DerivedStatLineRecord[] }
      }
      if (res.data?.stats) {
        setPlayerStats(res.data.stats)
      }
      if (res.data?.derivedLines) {
        setDerivedLines(res.data.derivedLines)
      }
    } catch {
      // keep local state if stats refresh fails
    }
  }, [apiClient, isReady, sessionId])

  useEffect(() => {
    if (!isReady || !sessionId || !hasPendingProcessing || editingId) return
    if (activeTab !== 'observations' && activeTab !== 'stats') return
    let pollCount = 0
    const maxPolls = 40

    const interval = window.setInterval(() => {
      pollCount += 1
      if (pollCount > maxPolls) {
        window.clearInterval(interval)
        return
      }

      void apiClient
        .getObservationJobs(sessionId)
        .then(async (jobsRes: { data?: { jobs?: Array<{ status: string }> } }) => {
          const jobs = jobsRes.data?.jobs ?? []
          const hasRunningJobs = jobs.some(j => j.status === 'PENDING' || j.status === 'RUNNING' || j.status === 'RETRY')
          if (hasRunningJobs) return

          window.clearInterval(interval)
          const res = (await apiClient.getSession(sessionId)) as { data?: { session?: Session } }
          const s = res.data?.session
          if (!s) return
          const norm = normalizeSession(s)
          setSession(norm)
          setObservations(norm.observations)
          setPlayerStats(norm.playerStats)
          if (norm.type === 'GAME') {
            await refreshStats()
          }
        })
        .catch(() => undefined)
    }, 3000)

    return () => clearInterval(interval)
  }, [isReady, sessionId, hasPendingProcessing, editingId, apiClient, refreshStats, activeTab])

  const startRecording = useCallback(() => {
    setTranscribeError(null)
    if (activeTab === 'observations') {
      setTranscript(null)
    }
    navigator.mediaDevices.getUserMedia({ audio: true }).then(
      stream => {
        streamRef.current = stream
        const recorder = new MediaRecorder(stream)
        mediaRecorderRef.current = recorder
        chunksRef.current = []
        recorder.ondataavailable = e => {
          if (e.data.size > 0) chunksRef.current.push(e.data)
        }
        recorder.start()
        setIsRecording(true)
      },
      err => {
        setTranscribeError(err instanceof Error ? err.message : 'Could not access microphone')
      }
    )
  }, [activeTab])

  const stopRecordingAndSend = useCallback(async () => {
    const recorder = mediaRecorderRef.current
    if (!recorder || recorder.state === 'inactive') return

    const blob = await new Promise<Blob>(resolve => {
      recorder.onstop = () => {
        const b = new Blob(chunksRef.current, { type: recorder.mimeType })
        resolve(b)
      }
      recorder.stop()
    })

    mediaRecorderRef.current = null
    streamRef.current?.getTracks().forEach(t => t.stop())
    streamRef.current = null
    setIsRecording(false)

    if (blob.size === 0) {
      setTranscribeError('No audio recorded')
      return
    }

    setIsTranscribing(true)
    setTranscribeError(null)
    const prompt = buildTranscribePrompt(sessionType, team)

    try {
      const wavBlob = await blobToWav(blob)
      const file = new File([wavBlob], 'recording.wav', { type: 'audio/wav' })
      const formData = new FormData()
      formData.append('file', file)

      if (activeTab === 'plan') {
        const res = (await apiClient.transcribeSession(sessionId, formData, {
          prompt,
          preview: true
        })) as { data?: { text?: string } }
        const text = (res.data?.text ?? '').trim()
        setPlanDrillDraft(text)
        return
      }

      if (activeTab === 'stats') {
        const res = (await apiClient.transcribeSession(sessionId, formData, {
          prompt
        })) as {
          data?: { text?: string; observation?: ObservationRecord }
        }
        const text = (res.data?.text ?? '').trim()
        if (text && res.data?.observation) {
          setObservations(prev => [...prev, res.data!.observation!])
        }
        setTranscript(text)
        void refreshStats()
        return
      }

      const res = (await apiClient.transcribeSession(sessionId, formData, {
        prompt,
        drillId: recordDrillId || undefined
      })) as {
        data?: { text?: string; observation?: ObservationRecord }
      }
      const text = (res.data?.text ?? '').trim()
      if (text && res.data?.observation) {
        const obs = res.data.observation
        setObservations(prev => [...prev, obs])
        setEditingId(obs.id)
        setEditText(obs.text)
      }
      setTranscript(text)
    } catch (err) {
      setTranscribeError(err instanceof Error ? err.message : 'Failed to transcribe audio')
    } finally {
      setIsTranscribing(false)
    }
  }, [sessionType, team, sessionId, apiClient, recordDrillId, activeTab, refreshStats])

  const createDrillFromDraft = useCallback(async () => {
    const trimmed = planDrillDraft?.trim()
    if (!trimmed) return
    setCreatingDrillFromTranscript(true)
    setTranscribeError(null)
    try {
      const res = (await apiClient.createDrillFromTranscript(sessionId, {
        transcript: trimmed
      })) as { data?: { practicePlan?: PracticePlanRecord } }
      const p = res.data?.practicePlan
      if (p) {
        handlePlanUpdated(p)
        setPlanDrillDraft(null)
      }
    } catch (err) {
      setTranscribeError(err instanceof Error ? err.message : 'Failed to create drill')
    } finally {
      setCreatingDrillFromTranscript(false)
    }
  }, [planDrillDraft, sessionId, apiClient, handlePlanUpdated])

  const startEdit = useCallback((obs: ObservationRecord) => {
    setEditingId(obs.id)
    setEditText(obs.text)
  }, [])

  const cancelEdit = useCallback(() => {
    setEditingId(null)
    setEditText('')
  }, [])

  const saveObservation = useCallback(
    async (observationId: string) => {
      const trimmed = editText.trim()
      if (!trimmed) return
      setSavingId(observationId)
      try {
        const res = (await apiClient.updateObservation(sessionId, observationId, { text: trimmed })) as {
          data?: { observation?: ObservationRecord }
        }
        const updated = res.data?.observation
        if (updated) {
          setObservations(prev =>
            prev.map(o => (o.id === observationId ? updated : o))
          )
        }
        setEditingId(null)
        setEditText('')
      } catch {
        setTranscribeError('Failed to save observation')
      } finally {
        setSavingId(null)
      }
    },
    [sessionId, editText, apiClient]
  )

  const planDrills = useMemo(
    () => session?.practicePlan?.drills ?? [],
    [session?.practicePlan?.drills]
  )

  const rosterForPlayerSheet = useMemo((): TeamMemberRecord[] => {
    if (!session) return []
    if (session.participants.length > 0) {
      return session.participants.map(p => p.teamMember)
    }
    return session.team.members.filter(m => m.isActive !== false)
  }, [session])

  const playerObservationSections = useMemo(() => {
    if (!playerSheetMemberId) return null
    return buildPlayerObservationSections(observations, planDrills, playerSheetMemberId)
  }, [observations, planDrills, playerSheetMemberId])

  const visibleStats = useMemo(() => {
    if (!session) return []
    const roster =
      session.participants.length > 0
        ? session.participants.map(p => p.teamMember)
        : session.team.members.filter(m => m.isActive !== false)
    const byMemberId = new Map(playerStats.map(s => [s.teamMemberId, s]))
    return roster.map(member => {
      const stat = byMemberId.get(member.id)
      if (stat) return stat
      return {
        id: `virtual-${member.id}`,
        sessionId: session.id,
        teamMemberId: member.id,
        points: 0,
        assists: 0,
        rebounds: 0,
        steals: 0,
        blocks: 0,
        turnovers: 0,
        fouls: 0,
        createdAt: new Date(0).toISOString(),
        updatedAt: new Date(0).toISOString(),
        teamMember: member
      } satisfies SessionPlayerStatRecord
    })
  }, [session, playerStats])

  const teamTotals = useMemo(
    () =>
      visibleStats.reduce<Record<StatField, number>>(
        (acc, stat) => {
          for (const field of STAT_FIELDS) {
            acc[field] += stat.final?.[field] ?? stat[field]
          }
          return acc
        },
        {
          points: 0,
          assists: 0,
          rebounds: 0,
          steals: 0,
          blocks: 0,
          turnovers: 0,
          fouls: 0
        }
      ),
    [visibleStats]
  )

  const openStatEditor = useCallback((teamMemberId: string, field: StatField, value: number) => {
    setActiveStatCell({ teamMemberId, field })
    setActiveStatValue(String(value))
  }, [])

  const startDerivedLineEdit = useCallback((line: DerivedStatLineRecord) => {
    setEditingDerivedLineId(line.id)
    setDerivedDraft({
      points: String(line.points),
      assists: String(line.assists),
      rebounds: String(line.rebounds),
      steals: String(line.steals),
      blocks: String(line.blocks),
      turnovers: String(line.turnovers),
      fouls: String(line.fouls)
    })
  }, [])

  const resolveUnrecognizedLine = useCallback(
    async (line: DerivedStatLineRecord) => {
      const selectedMemberId = resolveMemberByLineId[line.id]
      const rawName = (line.playerRef ?? '').trim()
      if (!selectedMemberId || !rawName) return
      try {
        await apiClient.resolveUnrecognizedName(sessionId, line.observationId, {
          rawName,
          teamMemberId: selectedMemberId
        })
        setResolveMemberByLineId(prev => ({ ...prev, [line.id]: '' }))
        await refreshStats()
      } catch {
        setTranscribeError('Failed to map unresolved name to player')
      }
    },
    [apiClient, sessionId, resolveMemberByLineId, refreshStats]
  )

  const commitActiveStat = useCallback(async () => {
    if (!activeStatCell) return
    const parsed = Number.parseInt(activeStatValue.trim() === '' ? '0' : activeStatValue, 10)
    const nextValue = Number.isNaN(parsed) ? 0 : Math.max(0, parsed)
    const key = `${activeStatCell.teamMemberId}:${activeStatCell.field}:override`
    setUpdatingStatKey(key)
    try {
      const res = (await apiClient.patchSessionStatMetric(
        sessionId,
        activeStatCell.teamMemberId,
        activeStatCell.field,
        { manualOverride: nextValue, lock: true }
      )) as { data?: { stat?: SessionPlayerStatRecord } }
      if (res.data?.stat) {
        setPlayerStats(prev =>
          prev.map(s => (s.teamMemberId === activeStatCell.teamMemberId ? res.data!.stat! : s))
        )
      } else {
        void refreshStats()
      }
    } catch {
      setTranscribeError('Failed to update stat')
    } finally {
      setUpdatingStatKey(null)
      setActiveStatCell(null)
      setActiveStatValue('')
    }
  }, [activeStatCell, activeStatValue, apiClient, sessionId, refreshStats])

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0c0c0c] text-zinc-100 flex items-center justify-center">
        <p className="text-zinc-500">Loading session…</p>
      </div>
    )
  }

  if (error || !session) {
    return (
      <div className="min-h-screen bg-[#0c0c0c] text-zinc-100 flex flex-col items-center justify-center gap-4 px-6">
        <p className="text-red-400">{error ?? 'Session not found'}</p>
        <Link href="/entries" className="text-sm text-amber-400 hover:text-amber-300 underline">
          Back to entries
        </Link>
      </div>
    )
  }

  const eventLabel = SESSION_TYPE_LABELS[session.type]
  const teamName = session.team?.name ?? null
  const dateLabel = new Date(session.startedAt).toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short'
  })

  const renderTagChips = (obs: ObservationRecord) => {
    const statPending = obs.statStatus === 'PENDING' || obs.statStatus === 'PROCESSING'
    const statFailed = obs.statStatus === 'FAILED'

    if (obs.taggingStatus === 'PENDING' || obs.taggingStatus === 'PROCESSING') {
      return (
        <div className="inline-flex items-center gap-1">
          <span className="inline-flex items-center rounded-full border border-amber-500/40 bg-amber-500/10 px-2 py-0.5 text-[11px] font-medium text-amber-300">
            Tagging...
          </span>
          {statPending && (
            <span className="inline-flex items-center rounded-full border border-sky-500/40 bg-sky-500/10 px-2 py-0.5 text-[11px] font-medium text-sky-300">
              Deriving stats...
            </span>
          )}
        </div>
      )
    }

    if (obs.taggingStatus === 'FAILED') {
      return (
        <div className="inline-flex items-center gap-1">
          <span className="inline-flex items-center rounded-full border border-red-500/40 bg-red-500/10 px-2 py-0.5 text-[11px] font-medium text-red-300">
            Tagging failed
          </span>
          {statFailed && (
            <span className="inline-flex items-center rounded-full border border-red-500/40 bg-red-500/10 px-2 py-0.5 text-[11px] font-medium text-red-300">
              Stat derive failed
            </span>
          )}
        </div>
      )
    }

    if (obs.playerTags.length > 0) {
      return (
        <>
          {obs.playerTags.map(tag => (
            <span
              key={tag.id}
              className="inline-flex items-center rounded-full border border-sky-500/40 bg-sky-500/10 px-2 py-0.5 text-[11px] font-medium text-sky-300"
            >
              #{tag.teamMember.number || '-'} {tag.teamMember.name || 'Unknown'}
            </span>
          ))}
        </>
      )
    }

    if (obs.scope === 'TEAM_WIDE') {
      return (
        <span className="inline-flex items-center rounded-full border border-zinc-600 bg-zinc-800/70 px-2 py-0.5 text-[11px] font-medium text-zinc-300">
          Team-wide
        </span>
      )
    }

    return null
  }

  const renderObservationRow = (obs: ObservationRecord) => (
    <li key={obs.id} className="px-4 py-3">
      {editingId === obs.id ? (
        <div className="space-y-3">
          <textarea
            value={editText}
            onChange={e => setEditText(e.target.value)}
            className="w-full min-h-[100px] rounded-xl border border-zinc-600 bg-zinc-800/50 px-4 py-3 text-base text-zinc-200 placeholder-zinc-500 focus:border-amber-500 focus:outline-none"
            placeholder="Observation text…"
            disabled={savingId === obs.id}
          />
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => saveObservation(obs.id)}
              disabled={!editText.trim() || savingId === obs.id}
              className="min-h-[44px] min-w-[88px] inline-flex items-center justify-center gap-2 rounded-xl bg-amber-500 px-4 py-3 text-sm font-medium text-black active:bg-amber-400 disabled:opacity-50 touch-target"
            >
              <Check className="w-4 h-4" />
              {savingId === obs.id ? 'Saving…' : 'Save'}
            </button>
            <button
              type="button"
              onClick={cancelEdit}
              disabled={savingId === obs.id}
              className="min-h-[44px] min-w-[88px] inline-flex items-center justify-center gap-2 rounded-xl border border-zinc-600 px-4 py-3 text-sm font-medium text-zinc-400 active:bg-zinc-800 disabled:opacity-50 touch-target"
            >
              <X className="w-4 h-4" />
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <>
          <div className="flex items-start justify-between gap-3">
            <p className="text-zinc-200 whitespace-pre-wrap text-sm sm:text-base flex-1 min-w-0 leading-snug">
              {obs.text}
            </p>
            <button
              type="button"
              onClick={() => startEdit(obs)}
              className="shrink-0 rounded-xl p-3 min-h-[44px] min-w-[44px] flex items-center justify-center text-zinc-500 active:bg-zinc-700/50 active:text-amber-400 touch-target cursor-pointer"
              title="Edit"
            >
              <Pencil className="w-5 h-5" />
            </button>
            {isGameSession && (
              <button
                type="button"
                onClick={async () => {
                  try {
                    await apiClient.rerunObservationProcessing(sessionId, obs.id)
                    setTranscribeError(null)
                  } catch {
                    setTranscribeError('Failed to rerun observation calculations')
                  }
                }}
                className="shrink-0 rounded-xl p-3 min-h-[44px] min-w-[44px] flex items-center justify-center text-zinc-500 active:bg-zinc-700/50 active:text-amber-400 touch-target cursor-pointer"
                title="Rerun observation calculations"
              >
                ↻
              </button>
            )}
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1">
            {obs.drill && (
              <span className="inline-flex items-center rounded-full border border-violet-500/40 bg-violet-500/10 px-2 py-0.5 text-[11px] font-medium text-violet-300">
                {obs.drill.title}
              </span>
            )}
            {renderTagChips(obs)}
            {(obs.statExtraction as { stats?: Array<Record<string, number>> } | null)?.stats?.length ? (
              <span className="inline-flex items-center rounded-full border border-emerald-500/40 bg-emerald-500/10 px-2 py-0.5 text-[11px] font-medium text-emerald-300">
                {(obs.statExtraction as { stats?: Array<Record<string, number>> }).stats!.length} stat lines
              </span>
            ) : null}
            {((obs.statExtraction as { unresolvedCount?: number } | null)?.unresolvedCount ?? 0) > 0 ? (
              <span className="inline-flex items-center rounded-full border border-amber-500/40 bg-amber-500/10 px-2 py-0.5 text-[11px] font-medium text-amber-300">
                {(obs.statExtraction as { unresolvedCount?: number }).unresolvedCount} unresolved name(s)
              </span>
            ) : null}
            <span className="text-[11px] text-zinc-500">
              {new Date(obs.recordedAt).toLocaleString(undefined, {
                dateStyle: 'short',
                timeStyle: 'short'
              })}
            </span>
          </div>
        </>
      )}
    </li>
  )

  const playerSheetMember = rosterForPlayerSheet.find(m => m.id === playerSheetMemberId)
  const playerSheetTaggedTotal =
    playerObservationSections?.reduce((n, s) => n + s.observations.length, 0) ?? 0
  const isGameSession = session.type === 'GAME'

  return (
    <div
      className={`min-h-screen bg-[#0c0c0c] text-zinc-100 flex flex-col ${
        showRecordBar
          ? 'pb-[calc(9rem+env(safe-area-inset-bottom))]'
          : 'pb-[max(1.5rem,env(safe-area-inset-bottom))]'
      }`}
    >
      <div className="max-w-2xl mx-auto w-full px-4 sm:px-6 py-6 sm:py-8 flex-1">
        <div className="mb-6">
          <Link
            href="/entries"
            className="inline-flex items-center gap-2 text-sm text-zinc-500 active:text-zinc-300 mb-4 min-h-[44px] touch-target"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to entries
          </Link>
          <p className="text-sm text-amber-400/90 font-medium uppercase tracking-wider">
            {eventLabel}
            {teamName && ` · ${teamName}`}
          </p>
          <h1 className="text-xl sm:text-3xl font-bold tracking-tight mt-1">Session</h1>
          <p className="text-zinc-500 mt-1 text-sm">{dateLabel}</p>
          <p className="text-zinc-500 mt-1 text-sm">
            {activeTab === 'observations'
              ? 'Record notes by voice or switch to Plan for practice drills.'
              : activeTab === 'plan'
                ? 'Build drills and goals. Voice on this tab transcribes first — then turn it into structured drill fields.'
                : 'Record game stats by voice, then quickly correct any values in the table.'}
          </p>
        </div>

        <div className="flex gap-2 mb-6 p-1 rounded-xl bg-zinc-900/50 border border-zinc-800">
          <button
            type="button"
            onClick={() => setTab('observations')}
            className={`flex-1 min-h-[44px] rounded-lg px-3 py-2.5 text-sm font-medium touch-target ${
              activeTab === 'observations'
                ? 'bg-zinc-800 text-amber-300 shadow-sm'
                : 'text-zinc-400 active:text-zinc-200'
            }`}
          >
            Observations
          </button>
          <button
            type="button"
            onClick={() => setTab('plan')}
            className={`flex-1 min-h-[44px] rounded-lg px-3 py-2.5 text-sm font-medium touch-target ${
              activeTab === 'plan'
                ? 'bg-zinc-800 text-amber-300 shadow-sm'
                : 'text-zinc-400 active:text-zinc-200'
            }`}
          >
            Plan
          </button>
          {isGameSession && (
            <button
              type="button"
              onClick={() => setTab('stats')}
              className={`flex-1 min-h-[44px] rounded-lg px-3 py-2.5 text-sm font-medium touch-target ${
                activeTab === 'stats'
                  ? 'bg-zinc-800 text-amber-300 shadow-sm'
                  : 'text-zinc-400 active:text-zinc-200'
              }`}
            >
              Stats
            </button>
          )}
        </div>

        {activeTab === 'plan' && session && (
          <>
            {transcribeError && (
              <div className="mb-4 rounded-xl bg-red-400/10 border border-red-400/30 px-4 py-3">
                <p className="text-sm text-red-400">{transcribeError}</p>
              </div>
            )}
            {planDrillDraft !== null && (
              <div className="mb-6 w-full rounded-xl bg-zinc-800/50 border border-zinc-700/50 p-4 space-y-3">
                <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider">
                  Drill transcript — edit, then create drill
                </p>
                <textarea
                  value={planDrillDraft}
                  onChange={e => setPlanDrillDraft(e.target.value)}
                  className="w-full min-h-[120px] rounded-xl border border-zinc-600 bg-zinc-900/50 px-4 py-3 text-sm text-zinc-200 placeholder-zinc-500 focus:border-amber-500 focus:outline-none"
                  placeholder="What you said will appear here. Add any details the transcription missed."
                  disabled={creatingDrillFromTranscript}
                />
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => void createDrillFromDraft()}
                    disabled={!planDrillDraft.trim() || creatingDrillFromTranscript}
                    className="min-h-[44px] inline-flex items-center justify-center rounded-xl bg-amber-500 px-4 py-3 text-sm font-semibold text-black disabled:opacity-50"
                  >
                    {creatingDrillFromTranscript ? 'Creating…' : 'Create drill from transcript'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setPlanDrillDraft(null)}
                    disabled={creatingDrillFromTranscript}
                    className="min-h-[44px] rounded-xl border border-zinc-600 px-4 py-3 text-sm text-zinc-400"
                  >
                    Discard
                  </button>
                </div>
              </div>
            )}
            <PracticePlanPanel
              sessionId={sessionId}
              sessionType={session.type}
              plan={session.practicePlan}
              onPlanUpdated={handlePlanUpdated}
            />
          </>
        )}

        {activeTab === 'observations' && (
          <>
            {transcribeError && (
              <div className="mb-4 rounded-xl bg-red-400/10 border border-red-400/30 px-4 py-3">
                <p className="text-sm text-red-400">{transcribeError}</p>
              </div>
            )}
            {transcript !== null && transcript !== '' && (
              <div className="mb-6 w-full rounded-xl bg-zinc-800/50 border border-zinc-700/50 p-4">
                <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-2">
                  Last transcript
                </p>
                <p className="text-zinc-200 whitespace-pre-wrap text-sm">{transcript}</p>
              </div>
            )}

            {planDrills.length > 0 && (
              <div className="mb-4">
                <label className="block text-xs font-medium text-zinc-500 uppercase tracking-wider mb-2">
                  Link next recording to plan drill
                </label>
                <select
                  value={recordDrillId}
                  onChange={e => setRecordDrillId(e.target.value)}
                  className="w-full min-h-[44px] rounded-xl border border-zinc-600 bg-zinc-800/50 px-4 py-2 text-sm text-zinc-200"
                >
                  <option value="">None (whole session)</option>
                  {planDrills.map(d => (
                    <option key={d.id} value={d.id}>
                      {d.title}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {rosterForPlayerSheet.length > 0 && (
              <div className="mb-4">
                <label className="block text-xs font-medium text-zinc-500 uppercase tracking-wider mb-2">
                  View by player
                </label>
                <select
                  value={playerSheetMemberId}
                  onChange={e => setPlayerSheetMemberId(e.target.value)}
                  className="w-full min-h-[44px] rounded-xl border border-zinc-600 bg-zinc-800/50 px-4 py-2 text-sm text-zinc-200"
                >
                  <option value="">All observations (chronological)</option>
                  {rosterForPlayerSheet.map(m => (
                    <option key={m.id} value={m.id}>
                      #{m.number || '—'} {m.name || 'Player'} — grouped by drill
                    </option>
                  ))}
                </select>
                {playerSheetMemberId ? (
                  <p className="mt-2 text-[11px] text-zinc-500 leading-relaxed">
                    Shows notes where this player is tagged. General = no drill link or whole-session
                    recordings; then each plan drill in order.
                  </p>
                ) : null}
              </div>
            )}

            <div className="rounded-xl border border-zinc-700/50 bg-zinc-900/30 overflow-hidden">
              <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider px-4 py-3 border-b border-zinc-700/50">
                {playerSheetMemberId && playerSheetMember
                  ? `Player sheet · #${playerSheetMember.number || '—'} ${playerSheetMember.name || 'Player'} (${playerSheetTaggedTotal})`
                  : `Observations (${observations.length})`}
              </p>
              <div className="px-4 py-2 border-b border-zinc-700/50 text-[11px] text-zinc-500 flex flex-wrap gap-3">
                <span>Tagging... = analyzing transcript</span>
                <span>Blue chips = specific players</span>
                <span>Team-wide = note applies to whole team</span>
              </div>
              {observations.length === 0 ? (
                <p className="px-4 py-6 text-zinc-500 text-sm text-center">
                  No observations yet. Tap the mic below to record.
                </p>
              ) : playerSheetMemberId && playerObservationSections ? (
                playerSheetTaggedTotal === 0 ? (
                  <p className="px-4 py-6 text-zinc-500 text-sm text-center">
                    No observations tagged for this player yet. After transcription finishes, player chips
                    appear on matching notes — then they show up here by drill.
                  </p>
                ) : (
                  <div className="divide-y divide-zinc-700/50">
                    {playerObservationSections
                      .filter(sec => sec.drillId === null || sec.observations.length > 0)
                      .map(sec => (
                      <div key={sec.drillId ?? 'general'} className="px-0 py-0">
                        <div className="px-4 py-2.5 bg-zinc-950/50 border-b border-zinc-800/80">
                          <p className="text-xs font-semibold text-amber-400/90 uppercase tracking-wider">
                            {sec.drillTitle ?? 'Drill'}
                          </p>
                          <p className="text-[11px] text-zinc-500 mt-0.5">
                            {sec.observations.length}{' '}
                            {sec.observations.length === 1 ? 'note' : 'notes'}
                            {sec.drillId === null
                              ? ' · not tied to a specific drill'
                              : sec.sortOrder != null
                                ? ` · drill ${sec.sortOrder + 1} in plan`
                                : ''}
                          </p>
                        </div>
                        {sec.observations.length === 0 ? (
                          <p className="px-4 py-3 text-zinc-600 text-sm">No notes in this bucket.</p>
                        ) : (
                          <ul className="divide-y divide-zinc-700/50">{sec.observations.map(renderObservationRow)}</ul>
                        )}
                      </div>
                    ))}
                  </div>
                )
              ) : (
                <ul className="divide-y divide-zinc-700/50">{observations.map(renderObservationRow)}</ul>
              )}
            </div>
          </>
        )}

        {activeTab === 'stats' && isGameSession && (
          <>
            {transcribeError && (
              <div className="mb-4 rounded-xl bg-red-400/10 border border-red-400/30 px-4 py-3">
                <p className="text-sm text-red-400">{transcribeError}</p>
              </div>
            )}
            {transcript !== null && transcript !== '' && (
              <div className="mb-6 w-full rounded-xl bg-zinc-800/50 border border-zinc-700/50 p-4">
                <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-2">
                  Last transcript
                </p>
                <p className="text-zinc-200 whitespace-pre-wrap text-sm">{transcript}</p>
              </div>
            )}
            <div className="mb-4 flex items-center justify-between">
              <p className="text-xs text-zinc-500">Rerun all observation calculations for this game if attribution looks off.</p>
              <button
                type="button"
                onClick={async () => {
                  try {
                    await apiClient.rerunGameStats(sessionId)
                    setTranscribeError(null)
                  } catch {
                    setTranscribeError('Failed to enqueue game rerun')
                  }
                }}
                className="min-h-[40px] rounded-lg border border-zinc-600 px-3 text-xs text-zinc-300 cursor-pointer"
              >
                Rerun game calculations
              </button>
            </div>
            <p className="mb-3 text-xs text-zinc-500">
              Tap a stat cell to set a manual value (locks that stat). Use lock buttons to unlock and resume
              automatic derivation from observations.
            </p>
            <div className="rounded-xl border border-zinc-700/50 bg-zinc-900/30 overflow-auto">
              <table className="w-full min-w-[760px] text-sm">
                <thead className="bg-zinc-950/60">
                  <tr className="text-left text-zinc-400">
                    <th className="px-3 py-2">Player</th>
                    <th className="px-2 py-2">PTS</th>
                    <th className="px-2 py-2">AST</th>
                    <th className="px-2 py-2">REB</th>
                    <th className="px-2 py-2">STL</th>
                    <th className="px-2 py-2">BLK</th>
                    <th className="px-2 py-2">TOV</th>
                    <th className="px-2 py-2">FLS</th>
                  </tr>
                </thead>
                <tbody>
                  {visibleStats.map(stat => (
                    <tr key={stat.teamMemberId} className="border-t border-zinc-800/80">
                      <td className="px-3 py-2 text-zinc-200">
                        #{stat.teamMember.number || '—'} {stat.teamMember.name || 'Player'}
                      </td>
                      {STAT_FIELDS.map(field => (
                        <td key={field} className="px-2 py-2">
                          <div className="flex items-center gap-1">
                          {activeStatCell?.teamMemberId === stat.teamMemberId &&
                          activeStatCell?.field === field ? (
                            <input
                              type="number"
                              inputMode="numeric"
                              min={0}
                              autoFocus
                              value={activeStatValue}
                              onChange={e => setActiveStatValue(e.target.value)}
                              onBlur={() => void commitActiveStat()}
                              onKeyDown={e => {
                                if (e.key === 'Enter') {
                                  e.preventDefault()
                                  void commitActiveStat()
                                } else if (e.key === 'Escape') {
                                  setActiveStatCell(null)
                                  setActiveStatValue('')
                                }
                              }}
                              className="w-16 min-h-[40px] rounded-lg border border-amber-500 bg-zinc-950 px-2 py-1.5 text-zinc-100"
                            />
                          ) : (
                            <button
                              type="button"
                              onClick={() =>
                                openStatEditor(stat.teamMemberId, field, stat.final?.[field] ?? stat[field])
                              }
                              className="w-16 min-h-[40px] rounded-lg border border-zinc-700 bg-zinc-900 px-2 py-1.5 text-zinc-100 text-left active:border-amber-500/70 active:bg-zinc-800"
                              aria-label={`Edit ${field} for ${stat.teamMember.name || 'player'}`}
                            >
                              {stat.final?.[field] ?? stat[field]}
                            </button>
                          )}
                            <button
                              type="button"
                              onClick={async () => {
                                const locked = stat.lockState?.[field]?.locked ?? false
                                const key = `${stat.teamMemberId}:${field}:lock`
                                setUpdatingStatKey(key)
                                try {
                                  const res = (await apiClient.patchSessionStatMetric(
                                    sessionId,
                                    stat.teamMemberId,
                                    field,
                                    { lock: !locked, manualOverride: locked ? null : undefined }
                                  )) as { data?: { stat?: SessionPlayerStatRecord } }
                                  if (res.data?.stat) {
                                    setPlayerStats(prev =>
                                      prev.map(s => (s.teamMemberId === stat.teamMemberId ? res.data!.stat! : s))
                                    )
                                  } else {
                                    void refreshStats()
                                  }
                                } catch {
                                  setTranscribeError('Failed to update stat lock')
                                } finally {
                                  setUpdatingStatKey(null)
                                }
                              }}
                              disabled={updatingStatKey === `${stat.teamMemberId}:${field}:lock`}
                              className="h-10 w-8 rounded-lg border border-zinc-700 bg-zinc-900/70 text-zinc-400 hover:text-amber-300"
                              title={(stat.lockState?.[field]?.locked ?? false) ? 'Unlock stat' : 'Lock stat'}
                            >
                              {(stat.lockState?.[field]?.locked ?? false) ? (
                                <Lock className="mx-auto h-3.5 w-3.5" />
                              ) : (
                                <Unlock className="mx-auto h-3.5 w-3.5" />
                              )}
                            </button>
                          </div>
                        </td>
                      ))}
                    </tr>
                  ))}
                  <tr className="border-t border-zinc-700 bg-zinc-950/60">
                    <td className="px-3 py-2 font-semibold text-amber-300">Team total</td>
                    {STAT_FIELDS.map(field => (
                      <td key={field} className="px-2 py-2 font-semibold text-amber-200">
                        {teamTotals[field]}
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
            <div className="mt-6 rounded-xl border border-zinc-700/50 bg-zinc-900/30">
              <div className="px-4 py-3 border-b border-zinc-700/50 flex items-center justify-between">
                <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Derivation log</p>
                <button
                  type="button"
                  onClick={() => void refreshStats()}
                  className="text-xs text-zinc-400 underline cursor-pointer"
                >
                  Refresh
                </button>
              </div>
              {derivedLines.length === 0 ? (
                <p className="px-4 py-4 text-sm text-zinc-500">No derived stat lines yet.</p>
              ) : (
                <ul className="divide-y divide-zinc-800/80">
                  {derivedLines.map(line => (
                    <li key={line.id} className="px-4 py-3 space-y-2">
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-sm text-zinc-200">
                          {line.teamMember
                            ? `#${line.teamMember.number || '—'} ${line.teamMember.name || 'Player'}`
                            : line.playerRef || 'Unresolved player'}
                        </p>
                        <span className="text-[11px] text-zinc-500">{line.status}</span>
                      </div>
                      <p className="text-[12px] text-zinc-400">
                        +{line.points} PTS, +{line.assists} AST, +{line.rebounds} REB, +{line.steals} STL, +{line.blocks} BLK, +{line.turnovers} TOV, +{line.fouls} FLS
                      </p>
                      {line.evidenceText && (
                        <p className="text-[12px] text-zinc-500">&quot;{line.evidenceText}&quot;</p>
                      )}
                      {!line.teamMemberId && line.playerRef && (
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-[11px] text-amber-300">Unresolved: {line.playerRef}</span>
                          <select
                            value={resolveMemberByLineId[line.id] ?? ''}
                            onChange={e =>
                              setResolveMemberByLineId(prev => ({ ...prev, [line.id]: e.target.value }))
                            }
                            className="min-h-[30px] rounded border border-zinc-700 bg-zinc-950 px-2 py-1 text-[11px] text-zinc-100"
                          >
                            <option value="">Map name to player...</option>
                            {(session?.team.members ?? []).map(m => (
                              <option key={m.id} value={m.id}>
                                #{m.number || '—'} {m.name || 'Player'}
                              </option>
                            ))}
                          </select>
                          <button
                            type="button"
                            onClick={() => void resolveUnrecognizedLine(line)}
                            disabled={!resolveMemberByLineId[line.id]}
                            className="rounded-md border border-amber-600/60 px-2 py-1 text-[11px] text-amber-300 disabled:opacity-50 cursor-pointer"
                          >
                            Map + rerun
                          </button>
                        </div>
                      )}
                      {editingDerivedLineId === line.id ? (
                        <div className="space-y-2">
                          <div className="grid grid-cols-4 gap-2">
                            {STAT_FIELDS.map(field => (
                              <label key={field} className="text-[10px] text-zinc-500">
                                {field.toUpperCase()}
                                <input
                                  type="number"
                                  min={0}
                                  value={derivedDraft[field]}
                                  onChange={e =>
                                    setDerivedDraft(prev => ({
                                      ...prev,
                                      [field]: e.target.value
                                    }))
                                  }
                                  className="mt-1 w-full rounded border border-zinc-700 bg-zinc-950 px-1.5 py-1 text-[12px] text-zinc-100"
                                />
                              </label>
                            ))}
                          </div>
                          <div className="flex flex-wrap gap-2">
                            <button
                              type="button"
                              onClick={async () => {
                                try {
                                  await apiClient.editDerivedStatLine(sessionId, line.id, {
                                    teamMemberId: line.teamMemberId,
                                    points: Math.max(0, Number.parseInt(derivedDraft.points || '0', 10) || 0),
                                    assists: Math.max(0, Number.parseInt(derivedDraft.assists || '0', 10) || 0),
                                    rebounds: Math.max(0, Number.parseInt(derivedDraft.rebounds || '0', 10) || 0),
                                    steals: Math.max(0, Number.parseInt(derivedDraft.steals || '0', 10) || 0),
                                    blocks: Math.max(0, Number.parseInt(derivedDraft.blocks || '0', 10) || 0),
                                    turnovers: Math.max(0, Number.parseInt(derivedDraft.turnovers || '0', 10) || 0),
                                    fouls: Math.max(0, Number.parseInt(derivedDraft.fouls || '0', 10) || 0),
                                    reviewNote: 'Edited by coach'
                                  })
                                  setEditingDerivedLineId(null)
                                  await refreshStats()
                                } catch {
                                  setTranscribeError('Failed to save edited stat line')
                                }
                              }}
                              className="rounded-md border border-amber-600/60 px-2 py-1 text-[11px] text-amber-300 cursor-pointer"
                            >
                              Save line
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditingDerivedLineId(null)}
                              className="rounded-md border border-zinc-600 px-2 py-1 text-[11px] text-zinc-300 cursor-pointer"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={async () => {
                              try {
                                await apiClient.approveDerivedStatLine(sessionId, line.id)
                                await refreshStats()
                              } catch {
                                setTranscribeError('Failed to approve derived stat line')
                              }
                            }}
                            className="rounded-md border border-emerald-600/60 px-2 py-1 text-[11px] text-emerald-300 cursor-pointer"
                          >
                            Approve
                          </button>
                          <button
                            type="button"
                            onClick={async () => {
                              try {
                                await apiClient.rejectDerivedStatLine(sessionId, line.id, {
                                  reviewNote: 'Rejected by coach'
                                })
                                await refreshStats()
                              } catch {
                                setTranscribeError('Failed to reject derived stat line')
                              }
                            }}
                            className="rounded-md border border-red-600/60 px-2 py-1 text-[11px] text-red-300 cursor-pointer"
                          >
                            Reject
                          </button>
                          <button
                            type="button"
                            onClick={() => startDerivedLineEdit(line)}
                            className="rounded-md border border-amber-600/60 px-2 py-1 text-[11px] text-amber-300 cursor-pointer"
                          >
                            Edit line
                          </button>
                        </div>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </>
        )}
      </div>

      {showRecordBar && (
        <div className="fixed bottom-0 left-0 right-0 bg-[#0c0c0c]/95 border-t border-zinc-800 flex flex-col items-center gap-2 pt-3 px-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
          {!isRecording ? (
            <button
              type="button"
              onClick={startRecording}
              disabled={isTranscribing}
              className="flex items-center justify-center w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-amber-500 active:bg-amber-400 disabled:opacity-50 disabled:cursor-not-allowed text-black transition-colors touch-target shadow-lg"
              title="Start recording"
            >
              <Mic className="w-10 h-10 sm:w-12 sm:h-12" />
            </button>
          ) : (
            <button
              type="button"
              onClick={() => void stopRecordingAndSend()}
              className="flex items-center justify-center w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-red-500 active:bg-red-400 text-white transition-colors animate-pulse touch-target shadow-lg"
              title="Stop and transcribe"
            >
              <Square className="w-8 h-8 sm:w-10 sm:h-10" fill="currentColor" />
            </button>
          )}
          <p className="text-sm text-zinc-500 text-center max-w-sm">
            {isRecording
              ? 'Recording… Tap to stop and transcribe.'
              : isTranscribing
                ? 'Transcribing…'
                : activeTab === 'plan'
                  ? 'Plan tab: voice fills a draft — then create the drill.'
                  : activeTab === 'stats'
                    ? 'Stats tab: voice creates observations that derive stats in background.'
                    : 'Tap mic to record an observation.'}
          </p>
        </div>
      )}
    </div>
  )
}
