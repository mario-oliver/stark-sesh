import type { Uploadable } from 'openai'
import { getOpenAI } from './openai'

/**
 * Supported transcription models per the Speech-to-Text guide:
 * https://developers.openai.com/api/docs/guides/speech-to-text
 *
 * - whisper-1: Open-source Whisper, supports json | text | srt | verbose_json | vtt
 * - gpt-4o-transcribe / gpt-4o-mini-transcribe: Higher quality, json only (default)
 * - gpt-4o-transcribe-diarize: Speaker labels, requires chunking for >30s
 */
export type TranscribeModel = 'whisper-1' | 'gpt-4o-transcribe' | 'gpt-4o-mini-transcribe' | 'gpt-4o-transcribe-diarize'

/**
 * Response format depends on model:
 * - whisper-1: json | text | srt | verbose_json | vtt
 * - gpt-4o-transcribe / gpt-4o-mini-transcribe: json (default)
 * - gpt-4o-transcribe-diarize: json | text | diarized_json
 */
export type TranscribeResponseFormat = 'json' | 'text' | 'srt' | 'verbose_json' | 'vtt' | 'diarized_json'

export interface TranscribeOptions {
  /** Model to use. Default: whisper-1 for broad format support. */
  model?: TranscribeModel
  /** Output format. Default: json (we always extract .text in the route). */
  response_format?: TranscribeResponseFormat
  /** Optional prompt to improve accuracy (e.g. correct spellings, context). */
  prompt?: string
  /** Language of the input audio (ISO-639-1, e.g. "en"). Improves accuracy and latency. */
  language?: string
}

/** Segment from verbose_json (whisper-1) or diarized_json (gpt-4o-transcribe-diarize). */
interface TranscriptionSegment {
  start: number
  end: number
  text: string
  speaker?: string
}

export interface TranscribeResult {
  text: string
  /** Present when response_format is verbose_json (whisper-1). */
  segments?: Array<{ start: number; end: number; text: string }>
  /** Present for gpt-4o-transcribe-diarize with diarized_json. */
  segments_diarized?: Array<{
    speaker: string
    start: number
    end: number
    text: string
  }>
}

/**
 * Transcribe audio using the OpenAI SDK (transcriptions endpoint).
 * Uses the same API as the quickstart: client.audio.transcriptions.create(...)
 */
export async function transcribe(file: Uploadable, options: TranscribeOptions = {}): Promise<TranscribeResult> {
  const openai = getOpenAI()
  const {
    model = 'gpt-4o-transcribe',
    // model = 'gpt-4o-mini-transcribe',
    // model = 'whisper-1',
    response_format = 'json',
    prompt,
    language
  } = options

  const transcription = await openai.audio.transcriptions.create({
    file,
    model,
    response_format,
    ...(prompt && { prompt }),
    ...(language && { language })
  })

  // SDK returns string when response_format is text | srt | vtt
  const text = typeof transcription === 'string' ? transcription : transcription.text

  const result: TranscribeResult = { text }

  if (typeof transcription !== 'string' && 'segments' in transcription) {
    const segs = (transcription as { segments?: Array<TranscriptionSegment> }).segments
    if (segs?.length) {
      const hasSpeaker = segs.some(s => 'speaker' in s && s.speaker != null)
      if (hasSpeaker) {
        result.segments_diarized = segs.map(s => ({
          speaker: (s as { speaker: string }).speaker,
          start: s.start,
          end: s.end,
          text: s.text
        }))
      } else {
        result.segments = segs.map(s => ({
          start: s.start,
          end: s.end,
          text: s.text
        }))
      }
    }
  }

  return result
}
