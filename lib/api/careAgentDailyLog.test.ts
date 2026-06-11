import { describe, expect, it } from 'vitest'
import type { AxiosInstance, AxiosRequestConfig } from 'axios'
import { ApiClient } from './api-client'
import type { CareAgentSessionPayload, DailyLogDraft } from './endpoints/dogs'

/**
 * AC1: the hand-written client can create a DAILY_LOG session (with voiceNoteId),
 * send a message, and confirm with selectedChangeIds — against mocked new-shape
 * responses. We inject a fake axios that records every request config and returns
 * a canned, already-unwrapped payload (the real interceptor returns `response.data`).
 */
function fakeClient(responseData: unknown) {
  const calls: AxiosRequestConfig[] = []
  const axios = {
    request: async (config: AxiosRequestConfig) => {
      calls.push(config)
      return responseData
    }
  } as unknown as AxiosInstance
  return { client: new ApiClient(axios), calls }
}

const DRAFT_READY: { success: boolean; data: CareAgentSessionPayload<DailyLogDraft> } = {
  success: true,
  data: {
    id: 'sess1',
    dogId: 'dog1',
    kind: 'DAILY_LOG',
    status: 'DRAFT_READY',
    messages: [],
    questions: [],
    voiceNoteId: 'vn1',
    createdAt: '2026-06-11T10:00:00.000Z',
    updatedAt: '2026-06-11T10:00:00.000Z',
    draft: {
      completions: [],
      adHocActions: [],
      observations: [
        {
          changeId: 'o1',
          type: 'PAIN',
          severity: 'MILD',
          bodyArea: 'Left hind leg',
          note: 'Slight limp',
          extractionConfidence: 0.82,
          needsReview: false
        }
      ],
      planChangeSuggestions: []
    }
  }
}

describe('care-agent DAILY_LOG client (AC1)', () => {
  it('creates a DAILY_LOG session with voiceNoteId and no message key', async () => {
    const { client, calls } = fakeClient(DRAFT_READY)
    const res = await client.createCareAgentSession<DailyLogDraft>('dog1', 'DAILY_LOG', {
      voiceNoteId: 'vn1'
    })

    expect(calls).toHaveLength(1)
    expect(calls[0].url).toBe('/v1/dogs/dog1/care-agent/sessions')
    expect(calls[0].method).toBe('POST')
    expect(calls[0].data).toEqual({ kind: 'DAILY_LOG', voiceNoteId: 'vn1' })
    expect('message' in (calls[0].data as object)).toBe(false)
    expect(res.data.draft?.observations[0].changeId).toBe('o1')
  })

  it('sends a clarifying-round reply via the messages route', async () => {
    const { client, calls } = fakeClient(DRAFT_READY)
    await client.sendCareAgentMessage<DailyLogDraft>('dog1', 'sess1', 'I meant the sit-to-stands')

    expect(calls[0].url).toBe('/v1/dogs/dog1/care-agent/sessions/sess1/messages')
    expect(calls[0].method).toBe('POST')
    expect(calls[0].data).toEqual({ message: 'I meant the sit-to-stands' })
  })

  it('confirms with exactly the selected changeIds (and nothing else)', async () => {
    const { client, calls } = fakeClient({ success: true, data: { status: 'committed', committed: 2 } })
    await client.confirmCareAgentSession('dog1', 'sess1', {
      selectedChangeIds: ['o1', 'c1']
    })

    expect(calls[0].url).toBe('/v1/dogs/dog1/care-agent/sessions/sess1/confirm')
    expect(calls[0].method).toBe('POST')
    expect(calls[0].data).toEqual({ selectedChangeIds: ['o1', 'c1'] })
  })
})
