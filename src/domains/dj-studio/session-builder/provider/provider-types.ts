export type PlaylistGenerationEnergyCurve =
  | 'gradual_rise'
  | 'warm_peak'
  | 'peak_cooldown'
  | 'steady'

export type PlaylistGenerationBpmInput = {
  start?: number
  end?: number
  min?: number
  max?: number
}

/**
 * Provider-facing candidate snapshot.
 * Selection authority is libraryItemId only — no org/profile/Prisma leakage.
 */
export type PlaylistGenerationCandidate = {
  libraryItemId: string
  title: string
  artists: string[]
  effectiveBpm: number | null
  effectiveCamelotKey: string | null
  durationMs: number | null
  energy: number | null
  rating: number | null
  familiarity: number | null
  isFavorite: boolean
  tags: string[]
  candidateScore: number
}

export type PlaylistGenerationRequest = {
  prompt: string
  targetDurationMin: number
  bpm?: PlaylistGenerationBpmInput
  energyCurve: PlaylistGenerationEnergyCurve
  trackCountHint?: number
  candidates: PlaylistGenerationCandidate[]
}

export type PlaylistGenerationWarningSeverity = 'info' | 'warning'

export type PlaylistGenerationWarning = {
  code: string
  message: string
  severity: PlaylistGenerationWarningSeverity
}

export type PlaylistGenerationTrack = {
  libraryItemId: string
  position: number
  transitionNote: string | null
  reason: string
}

export type PlaylistGenerationBpmProgression = {
  start: number | null
  end: number | null
  notes: string | null
}

/**
 * Untrusted provider-shaped result after structural + semantic validation.
 * Domain remains SoT for effective BPM/Camelot/duration.
 */
export type ValidatedPlaylistGenerationProposal = {
  title: string
  summary: string
  tracks: PlaylistGenerationTrack[]
  energyProgression: string
  bpmProgression: PlaylistGenerationBpmProgression
  warnings: PlaylistGenerationWarning[]
}

export type PlaylistGenerationResult = ValidatedPlaylistGenerationProposal
