import { scoreBpmComponent } from '@/domains/dj-studio/session-builder/candidate-engine/bpm-score'
import { SESSION_CANDIDATE_SCORE_WEIGHTS } from '@/domains/dj-studio/session-builder/candidate-engine/constants'
import {
  knownMinMax,
  normalizeRelative,
} from '@/domains/dj-studio/session-builder/candidate-engine/normalize-relative'
import { scoreTagRelevance } from '@/domains/dj-studio/session-builder/candidate-engine/tag-relevance'
import type {
  CandidateSelectionInput,
  SessionCandidate,
  SessionCandidateScoreBreakdown,
  SessionCandidateSource,
} from '@/domains/dj-studio/session-builder/types'

export type RelativeNormalizationRanges = {
  rating: { min: number | null; max: number | null }
  familiarity: { min: number | null; max: number | null }
}

export function buildRelativeNormalizationRanges(
  candidates: SessionCandidateSource[],
): RelativeNormalizationRanges {
  return {
    rating: knownMinMax(candidates.map((candidate) => candidate.rating)),
    familiarity: knownMinMax(
      candidates.map((candidate) => candidate.familiarity),
    ),
  }
}

export function scoreSessionCandidate(
  candidate: SessionCandidateSource,
  input: CandidateSelectionInput,
  ranges: RelativeNormalizationRanges,
): SessionCandidate {
  const bpmComponent = scoreBpmComponent(candidate.effectiveBpm, input.bpm)
  const ratingComponent = normalizeRelative(
    candidate.rating,
    ranges.rating.min,
    ranges.rating.max,
  )
  const familiarityComponent = normalizeRelative(
    candidate.familiarity,
    ranges.familiarity.min,
    ranges.familiarity.max,
  )
  const favoriteComponent = candidate.isFavorite ? 1 : 0
  const tagsComponent = scoreTagRelevance(
    input.prompt,
    candidate.tags.map((tag) => tag.normalizedName || tag.name),
  )
  const energyComponent = candidate.energy === null ? 0 : 1
  const camelotComponent = candidate.effectiveCamelotKey === null ? 0 : 1

  const scoreBreakdown: SessionCandidateScoreBreakdown = {
    bpm: bpmComponent * SESSION_CANDIDATE_SCORE_WEIGHTS.bpm,
    rating: ratingComponent * SESSION_CANDIDATE_SCORE_WEIGHTS.rating,
    familiarity:
      familiarityComponent * SESSION_CANDIDATE_SCORE_WEIGHTS.familiarity,
    favorite: favoriteComponent * SESSION_CANDIDATE_SCORE_WEIGHTS.favorite,
    tags: tagsComponent * SESSION_CANDIDATE_SCORE_WEIGHTS.tags,
    energy: energyComponent * SESSION_CANDIDATE_SCORE_WEIGHTS.energy,
    camelot: camelotComponent * SESSION_CANDIDATE_SCORE_WEIGHTS.camelot,
  }

  const score =
    scoreBreakdown.bpm +
    scoreBreakdown.rating +
    scoreBreakdown.familiarity +
    scoreBreakdown.favorite +
    scoreBreakdown.tags +
    scoreBreakdown.energy +
    scoreBreakdown.camelot

  return {
    ...candidate,
    score,
    scoreBreakdown,
  }
}
