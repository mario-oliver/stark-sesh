/** Legacy URL / UI label for create flow (maps to SessionType on the API) */
export type EventType = 'tryout' | 'practice' | 'game' | 'scrimmage' | 'other'

/** Coaching OS session kinds (API) */
export type SessionType =
  | 'TEAM_PRACTICE'
  | 'SKILL_SESSION'
  | 'GAME'
  | 'TRYOUT'
  | 'OTHER'

export function eventTypeToSessionType(e: EventType): SessionType {
  switch (e) {
    case 'practice':
    case 'scrimmage':
      return 'TEAM_PRACTICE'
    case 'game':
      return 'GAME'
    case 'tryout':
      return 'TRYOUT'
    default:
      return 'OTHER'
  }
}

export const SESSION_TYPE_LABELS: Record<SessionType, string> = {
  TEAM_PRACTICE: 'Team practice',
  SKILL_SESSION: 'Skill / small group',
  GAME: 'Game',
  TRYOUT: 'Tryout',
  OTHER: 'Other'
}

/** @deprecated use SESSION_TYPE_LABELS with SessionType */
export const EVENT_LABELS: Record<EventType, string> = {
  tryout: 'Tryout',
  practice: 'Practice',
  game: 'Game',
  scrimmage: 'Scrimmage',
  other: 'Other'
}

/** A team member present at the session (for transcript/LLM context) */
export interface TeamMember {
  number: string
  name: string
}

/** Context for a session: event + who's there */
export interface SessionContext {
  sessionType: SessionType
  eventLabel: string
  team: TeamMember[]
}

/** One observation/entry for the day */
export interface Observation {
  id: string
  text: string
  createdAt: string // ISO
}
