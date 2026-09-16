export type SessionEnergyCurve =
  | 'gradual_rise'
  | 'warm_peak'
  | 'peak_cooldown'
  | 'steady'

export type CandidateSelectionBpmInput = {
  start?: number
  end?: number
  min?: number
  max?: number
}

export type CandidateSelectionInput = {
  prompt: string
  bpm?: CandidateSelectionBpmInput
  energyCurve: SessionEnergyCurve
  trackCountHint?: number
}

export type SessionCandidateArtist = {
  id: string
  name: string
}

export type SessionCandidateTag = {
  id: string
  name: string
  normalizedName: string
}

/**
 * Raw Library row enriched with P1 effective musical fields, before scoring.
 * Selection authority for providers remains libraryItemId.
 */
export type SessionCandidateSource = {
  libraryItemId: string
  trackId: string
  title: string
  artists: SessionCandidateArtist[]
  effectiveBpm: number | null
  effectiveCamelotKey: string | null
  durationMs: number | null
  energy: number | null
  rating: number | null
  familiarity: number | null
  isFavorite: boolean
  tags: SessionCandidateTag[]
}

export type SessionCandidateScoreBreakdown = {
  bpm: number
  rating: number
  familiarity: number
  favorite: number
  tags: number
  energy: number
  camelot: number
}

export type SessionCandidate = SessionCandidateSource & {
  score: number
  scoreBreakdown: SessionCandidateScoreBreakdown
}
