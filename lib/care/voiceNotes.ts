import type { VoiceNoteRecord } from '@/lib/api/endpoints/dogs'

/** True while care extraction is running for a transcribed note. */
export function hasProcessingVoiceNotes(notes: VoiceNoteRecord[] | undefined): boolean {
  return notes?.some(n => n.processingStatus === 'TRANSCRIBED') ?? false
}
