import type { SpritePresetConfig, SpritePresetKey } from '@/lib/sprites/types'

export const spritePresets: Record<SpritePresetKey, SpritePresetConfig> = {
  dailyPlanLoading: {
    animation: 'run',
    message: "Fetching today's PT plan…",
    mode: 'blocking',
    background: 'dimmed'
  },
  voiceListening: {
    animation: 'idle',
    message: 'Listening…',
    subtext: 'Tell Stark what happened.',
    mode: 'inline',
    background: 'transparent'
  },
  voiceProcessing: {
    animation: 'run',
    message: 'Understanding your note…',
    subtext: "Matching this to today's PT plan.",
    mode: 'blocking',
    background: 'dimmed'
  },
  exerciseComplete: {
    animation: 'sitA',
    message: 'Nice work.',
    subtext: 'Logged for today.',
    mode: 'inline',
    background: 'transparent'
  },
  savingNote: {
    animation: 'bark',
    message: "Saving Stark's update…",
    mode: 'blocking',
    background: 'dimmed'
  },
  recoveryScoring: {
    animation: 'walk',
    message: 'Reading the signs…',
    subtext: 'Looking at movement, energy, soreness, and comfort.',
    mode: 'blocking',
    background: 'dimmed'
  },
  emptyState: {
    animation: 'idle',
    message: 'Nothing logged yet.',
    subtext: 'Start with a walk, mobility check, or voice note.',
    mode: 'inline',
    background: 'transparent'
  },
  notificationSetup: {
    animation: 'sitA',
    message: 'Stark can remind you.',
    subtext: 'Set gentle nudges for walks, meds, mobility, and recovery checks.',
    mode: 'inline',
    background: 'transparent'
  },
  dayComplete: {
    animation: 'playbow',
    message: "That's today's care done.",
    subtext: 'Small reps add up for aging dogs.',
    mode: 'inline',
    background: 'transparent'
  },
  errorRetry: {
    animation: 'sitB',
    message: 'Stark lost the scent.',
    subtext: 'Try again in a moment.',
    mode: 'inline',
    background: 'transparent'
  },
  caregiverSync: {
    animation: 'walk',
    message: 'New care note added.',
    subtext: "Stark's timeline is up to date.",
    mode: 'inline',
    background: 'transparent'
  }
}

export function resolveSpritePreset(preset: SpritePresetKey): SpritePresetConfig {
  return spritePresets[preset]
}
