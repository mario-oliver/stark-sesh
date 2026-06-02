'use client'

import React, { useCallback, useState } from 'react'
import { Pencil, Check, Sparkles, Trash2 } from 'lucide-react'
import { useApiClient } from '@/hooks/use-api-client'
import type { PracticePlanRecord, PracticeDrillRecord, PlanDrillInput } from '@/lib/api/endpoints/sessions'

interface PracticePlanPanelProps {
  sessionId: string
  sessionType: string
  plan: PracticePlanRecord | null
  onPlanUpdated: (plan: PracticePlanRecord) => void
}

export function PracticePlanPanel({
  sessionId,
  sessionType,
  plan,
  onPlanUpdated
}: PracticePlanPanelProps) {
  const { apiClient } = useApiClient()
  const isTeamPractice = sessionType === 'TEAM_PRACTICE'

  const [userPromptAddition, setUserPromptAddition] = useState('')
  const [generating, setGenerating] = useState(false)
  const [goalsDraft, setGoalsDraft] = useState('')
  const [savingGoals, setSavingGoals] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [newDrill, setNewDrill] = useState<PlanDrillInput>({
    title: '',
    description: '',
    execution: '',
    durationMinutes: null
  })
  const [addingDrill, setAddingDrill] = useState(false)
  const [editingDrillId, setEditingDrillId] = useState<string | null>(null)
  const [editDrill, setEditDrill] = useState<PlanDrillInput>({ title: '' })
  const [savingDrillId, setSavingDrillId] = useState<string | null>(null)

  React.useEffect(() => {
    if (plan?.goals?.length) {
      setGoalsDraft(plan.goals.join('\n'))
    } else {
      setGoalsDraft('')
    }
  }, [plan?.id, plan?.goals])

  const drills = plan?.drills ?? []
  const goals = plan?.goals ?? []

  const generatePlan = useCallback(async () => {
    if (!isTeamPractice) return
    setError(null)
    setGenerating(true)
    try {
      const res = (await apiClient.generatePracticePlan(sessionId, {
        userPromptAddition: userPromptAddition.trim() || undefined
      })) as { data?: { practicePlan?: PracticePlanRecord } }
      const p = res.data?.practicePlan
      if (p) onPlanUpdated(p)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not generate plan')
    } finally {
      setGenerating(false)
    }
  }, [apiClient, sessionId, isTeamPractice, userPromptAddition, onPlanUpdated])

  const saveGoals = useCallback(async () => {
    setSavingGoals(true)
    setError(null)
    try {
      const nextGoals = goalsDraft
        .split('\n')
        .map(l => l.trim())
        .filter(Boolean)
      const drillPayload: PlanDrillInput[] = drills.map(d => ({
        title: d.title,
        description: d.description,
        execution: d.execution,
        durationMinutes: d.durationMinutes,
        focusTags: d.focusTags,
        playerFocusMemberIds: d.playerFocus.map(p => p.teamMemberId)
      }))
      const res = (await apiClient.replacePracticePlan(sessionId, {
        title: plan?.title ?? null,
        goals: nextGoals,
        userPrompt: plan?.userPrompt ?? null,
        drills: drillPayload
      })) as { data?: { practicePlan?: PracticePlanRecord } }
      const p = res.data?.practicePlan
      if (p) onPlanUpdated(p)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not save goals')
    } finally {
      setSavingGoals(false)
    }
  }, [apiClient, sessionId, plan?.title, plan?.userPrompt, goalsDraft, drills, onPlanUpdated])

  const addDrill = useCallback(async () => {
    if (!newDrill.title?.trim()) return
    setAddingDrill(true)
    setError(null)
    try {
      const res = (await apiClient.addPracticeDrill(sessionId, {
        title: newDrill.title.trim(),
        description: (newDrill.description as string)?.trim() || null,
        execution: (newDrill.execution as string)?.trim() || null,
        durationMinutes: newDrill.durationMinutes ?? null
      })) as { data?: { practicePlan?: PracticePlanRecord } }
      const p = res.data?.practicePlan
      if (p) {
        onPlanUpdated(p)
        setNewDrill({ title: '', description: '', execution: '', durationMinutes: null })
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not add drill')
    } finally {
      setAddingDrill(false)
    }
  }, [apiClient, sessionId, newDrill, onPlanUpdated])

  const startEditDrill = useCallback((d: PracticeDrillRecord) => {
    setEditingDrillId(d.id)
    setEditDrill({
      title: d.title,
      description: d.description ?? '',
      execution: d.execution ?? '',
      durationMinutes: d.durationMinutes
    })
  }, [])

  const cancelEditDrill = useCallback(() => {
    setEditingDrillId(null)
    setEditDrill({ title: '' })
  }, [])

  const saveDrill = useCallback(
    async (drillId: string) => {
      setSavingDrillId(drillId)
      setError(null)
      try {
        const res = (await apiClient.updatePracticeDrill(sessionId, drillId, {
          title: editDrill.title?.trim(),
          description: (editDrill.description as string)?.trim() || null,
          execution: (editDrill.execution as string)?.trim() || null,
          durationMinutes: editDrill.durationMinutes
        })) as { data?: { practicePlan?: PracticePlanRecord } }
        const p = res.data?.practicePlan
        if (p) {
          onPlanUpdated(p)
          cancelEditDrill()
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Could not save drill')
      } finally {
        setSavingDrillId(null)
      }
    },
    [apiClient, sessionId, editDrill, onPlanUpdated, cancelEditDrill]
  )

  const removeDrill = useCallback(
    async (drillId: string) => {
      setSavingDrillId(drillId)
      setError(null)
      try {
        const res = (await apiClient.deletePracticeDrill(sessionId, drillId)) as {
          data?: { practicePlan?: PracticePlanRecord | null }
        }
        const p = res.data?.practicePlan
        if (p) onPlanUpdated(p)
        else if (plan) {
          onPlanUpdated({
            ...plan,
            drills: plan.drills.filter(d => d.id !== drillId)
          })
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Could not delete')
      } finally {
        setSavingDrillId(null)
      }
    },
    [apiClient, sessionId, plan, onPlanUpdated]
  )

  return (
    <div className="space-y-4">
      {error && (
        <div className="rounded-xl bg-red-400/10 border border-red-400/30 px-4 py-3">
          <p className="text-sm text-red-400">{error}</p>
        </div>
      )}

      {isTeamPractice && (
        <div className="rounded-xl border border-zinc-700/50 bg-zinc-900/40 p-4 space-y-3">
          <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-400" />
            Generate with AI
          </p>
          <p className="text-sm text-zinc-400">
            Optional focus for this practice. Uses your team roster. Replaces current drills and goals.
          </p>
          <textarea
            value={userPromptAddition}
            onChange={e => setUserPromptAddition(e.target.value)}
            placeholder="e.g. Help defense, 50 minutes, varsity…"
            className="w-full min-h-[88px] rounded-xl border border-zinc-600 bg-zinc-800/50 px-4 py-3 text-base text-zinc-200 placeholder-zinc-500 focus:border-amber-500 focus:outline-none"
            disabled={generating}
          />
          <button
            type="button"
            onClick={() => void generatePlan()}
            disabled={generating}
            className="w-full sm:w-auto min-h-[44px] inline-flex items-center justify-center gap-2 rounded-xl bg-amber-500 px-5 py-3 text-sm font-semibold text-black active:bg-amber-400 disabled:opacity-50 touch-target"
          >
            <Sparkles className="w-4 h-4" />
            {generating ? 'Generating…' : 'Generate practice plan'}
          </button>
        </div>
      )}

      {!isTeamPractice && (
        <p className="text-sm text-zinc-500">
          AI full-plan generation is for <span className="text-zinc-300">team practice</span> sessions. You can still
          add drills manually or use voice on this tab.
        </p>
      )}

      <div className="rounded-xl border border-zinc-700/50 bg-zinc-900/30 overflow-hidden">
        <div className="px-4 py-3 border-b border-zinc-700/50">
          <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Session goals</p>
          <p className="text-[11px] text-zinc-600 mt-1">One goal per line. Save updates the plan.</p>
          <textarea
            value={goalsDraft}
            onChange={e => setGoalsDraft(e.target.value)}
            placeholder="Outcomes you want from this session (one per line)…"
            className="mt-2 w-full min-h-[72px] rounded-xl border border-zinc-600 bg-zinc-800/50 px-3 py-2 text-sm text-zinc-200 placeholder-zinc-500 focus:border-amber-500 focus:outline-none"
          />
          <button
            type="button"
            onClick={() => void saveGoals()}
            disabled={savingGoals}
            className="mt-2 min-h-[40px] rounded-lg bg-zinc-700 px-4 py-2 text-sm font-medium text-zinc-100 disabled:opacity-50"
          >
            {savingGoals ? 'Saving…' : 'Save goals'}
          </button>
        </div>

        {plan?.title && (
          <p className="px-4 py-2 text-sm text-zinc-300 font-medium border-b border-zinc-700/50">{plan.title}</p>
        )}

        <div className="p-4 space-y-3 border-b border-zinc-700/50">
          <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Add drill</p>
          <input
            value={newDrill.title}
            onChange={e => setNewDrill(s => ({ ...s, title: e.target.value }))}
            placeholder="Title (e.g. Shell drill)"
            className="w-full min-h-[44px] rounded-xl border border-zinc-600 bg-zinc-800/50 px-4 py-2 text-base text-zinc-100"
          />
          <textarea
            value={newDrill.description ?? ''}
            onChange={e => setNewDrill(s => ({ ...s, description: e.target.value }))}
            placeholder="Description — what this drill is for (optional)"
            className="w-full min-h-[72px] rounded-xl border border-zinc-600 bg-zinc-800/50 px-4 py-2 text-sm text-zinc-200"
          />
          <textarea
            value={newDrill.execution ?? ''}
            onChange={e => setNewDrill(s => ({ ...s, execution: e.target.value }))}
            placeholder="Execution — how to run it: setup, reps, cues (optional)"
            className="w-full min-h-[88px] rounded-xl border border-zinc-600 bg-zinc-800/50 px-4 py-2 text-sm text-zinc-200"
          />
          <input
            type="number"
            min={0}
            value={newDrill.durationMinutes ?? ''}
            onChange={e =>
              setNewDrill(s => ({
                ...s,
                durationMinutes: e.target.value === '' ? null : parseInt(e.target.value, 10)
              }))
            }
            placeholder="Minutes (optional)"
            className="w-full min-h-[44px] rounded-xl border border-zinc-600 bg-zinc-800/50 px-4 py-2 text-base text-zinc-100"
          />
          <button
            type="button"
            onClick={() => void addDrill()}
            disabled={!newDrill.title?.trim() || addingDrill}
            className="min-h-[44px] w-full rounded-xl bg-zinc-700 px-4 py-3 text-sm font-medium text-zinc-100 disabled:opacity-50"
          >
            {addingDrill ? 'Adding…' : 'Add drill'}
          </button>
        </div>

        {drills.length === 0 ? (
          <p className="px-4 py-8 text-center text-sm text-zinc-500">
            No drills yet. Generate a plan, add one above, or describe one by voice from the mic below.
          </p>
        ) : (
          <ul className="divide-y divide-zinc-700/50">
            {drills.map((d, idx) => (
              <li key={d.id} className="px-4 py-3">
                {editingDrillId === d.id ? (
                  <div className="space-y-2">
                    <input
                      value={editDrill.title}
                      onChange={e => setEditDrill(s => ({ ...s, title: e.target.value }))}
                      className="w-full min-h-[44px] rounded-xl border border-zinc-600 bg-zinc-800/50 px-3 py-2 text-zinc-100"
                      placeholder="Title"
                    />
                    <textarea
                      value={editDrill.description ?? ''}
                      onChange={e => setEditDrill(s => ({ ...s, description: e.target.value }))}
                      placeholder="Description"
                      className="w-full min-h-[64px] rounded-xl border border-zinc-600 bg-zinc-800/50 px-3 py-2 text-sm text-zinc-200"
                    />
                    <textarea
                      value={editDrill.execution ?? ''}
                      onChange={e => setEditDrill(s => ({ ...s, execution: e.target.value }))}
                      placeholder="Execution"
                      className="w-full min-h-[72px] rounded-xl border border-zinc-600 bg-zinc-800/50 px-3 py-2 text-sm text-zinc-200"
                    />
                    <input
                      type="number"
                      min={0}
                      value={editDrill.durationMinutes ?? ''}
                      onChange={e =>
                        setEditDrill(s => ({
                          ...s,
                          durationMinutes: e.target.value === '' ? null : parseInt(e.target.value, 10)
                        }))
                      }
                      placeholder="Minutes"
                      className="w-full min-h-[44px] rounded-xl border border-zinc-600 bg-zinc-800/50 px-3 py-2 text-zinc-100"
                    />
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => void saveDrill(d.id)}
                        disabled={savingDrillId === d.id}
                        className="flex-1 min-h-[44px] rounded-xl bg-amber-500 text-black font-medium inline-flex items-center justify-center gap-1"
                      >
                        <Check className="w-4 h-4" />
                        Save
                      </button>
                      <button
                        type="button"
                        onClick={cancelEditDrill}
                        className="flex-1 min-h-[44px] rounded-xl border border-zinc-600 text-zinc-400"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex gap-3 items-start">
                    <span className="shrink-0 w-8 h-8 rounded-lg bg-zinc-800 text-zinc-400 text-sm font-semibold flex items-center justify-center">
                      {idx + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-zinc-100 font-medium text-sm">{d.title}</p>
                      {d.durationMinutes != null && (
                        <p className="text-[11px] text-zinc-500 mt-0.5">{d.durationMinutes} min</p>
                      )}
                      {d.focusTags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1">
                          {d.focusTags.map(t => (
                            <span
                              key={t}
                              className="text-[10px] px-2 py-0.5 rounded-full bg-sky-500/15 text-sky-300 border border-sky-500/30"
                            >
                              {t}
                            </span>
                          ))}
                        </div>
                      )}
                      {d.description && (
                        <p className="text-xs text-zinc-400 mt-1 whitespace-pre-wrap">{d.description}</p>
                      )}
                      {d.execution && (
                        <p className="text-xs text-zinc-500 mt-1 whitespace-pre-wrap border-l-2 border-zinc-600 pl-2">
                          {d.execution}
                        </p>
                      )}
                    </div>
                    <div className="flex shrink-0 gap-1">
                      <button
                        type="button"
                        onClick={() => startEditDrill(d)}
                        className="rounded-xl p-3 min-h-[44px] min-w-[44px] text-zinc-500 touch-target"
                      >
                        <Pencil className="w-5 h-5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => void removeDrill(d.id)}
                        disabled={savingDrillId === d.id}
                        className="rounded-xl p-3 min-h-[44px] min-w-[44px] text-zinc-500 touch-target disabled:opacity-50"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}

        {plan?.source && (
          <p className="px-4 py-2 text-[11px] text-zinc-600 border-t border-zinc-700/50">
            Source: {plan.source}
            {plan.lastGeneratedAt && ` · Generated ${new Date(plan.lastGeneratedAt).toLocaleString()}`}
          </p>
        )}
      </div>
    </div>
  )
}
