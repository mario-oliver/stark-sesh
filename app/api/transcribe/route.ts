import { NextResponse } from 'next/server'
import { transcribe } from '@/lib/speech-to-text'
import type { TranscribeModel, TranscribeResponseFormat } from '@/lib/speech-to-text'

export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File | null
    if (!file) {
      return NextResponse.json({ error: 'No audio file provided' }, { status: 400 })
    }

    // Optional options from the Speech-to-Text guide
    const model = (formData.get('model') as TranscribeModel | null) ?? undefined
    const response_format = (formData.get('response_format') as TranscribeResponseFormat | null) ?? undefined
    const promptParam = (formData.get('prompt') as string | null)?.trim()
    const language = (formData.get('language') as string | null) ?? undefined

    // Default prompt so the model knows we're talking about basketball (coaching, plays, strategy)
    const prompt =
      promptParam ||
      'This transcript is about basketball. It may include coaching terms, plays, sets, player positions, and game strategy.'

    const result = await transcribe(file, {
      model,
      response_format,
      prompt,
      language
    })

    return NextResponse.json({
      text: result.text,
      ...(result.segments && { segments: result.segments }),
      ...(result.segments_diarized && {
        segments_diarized: result.segments_diarized
      })
    })
  } catch (e) {
    if (e instanceof Error && e.message === 'OPENAI_API_KEY is not configured') {
      return NextResponse.json({ error: 'OPENAI_API_KEY is not configured' }, { status: 500 })
    }
    console.error('Transcribe error:', e)
    return NextResponse.json(
      {
        error: e instanceof Error ? e.message : 'Transcription failed'
      },
      { status: 500 }
    )
  }
}
