export const SESSION_CANDIDATE_SHORTLIST_MAX = 60
export const SESSION_CANDIDATE_MIN_ELIGIBLE = 8
export const SESSION_CANDIDATE_ARTIST_CAP = 4

/** Soft BPM envelope decay distance (exact formula: max(0, 1 - distance / 6)). */
export const SESSION_CANDIDATE_BPM_DECAY_DISTANCE = 6

export const SESSION_CANDIDATE_SCORE_WEIGHTS = {
  bpm: 35,
  rating: 15,
  familiarity: 10,
  favorite: 10,
  tags: 15,
  energy: 10,
  camelot: 5,
} as const

export type SessionCandidateScoreWeightKey =
  keyof typeof SESSION_CANDIDATE_SCORE_WEIGHTS
