import {
  DJ_STUDIO_ERROR_CODES,
  DjStudioError,
} from '@/domains/dj-studio/shared/errors'
import { passesHardBpmFilter } from '@/domains/dj-studio/session-builder/candidate-engine/bpm-score'
import {
  SESSION_CANDIDATE_ARTIST_CAP,
  SESSION_CANDIDATE_MIN_ELIGIBLE,
  SESSION_CANDIDATE_SHORTLIST_MAX,
} from '@/domains/dj-studio/session-builder/candidate-engine/constants'
import {
  buildRelativeNormalizationRanges,
  scoreSessionCandidate,
} from '@/domains/dj-studio/session-builder/candidate-engine/score-candidate'
import type {
  CandidateSelectionInput,
  SessionCandidate,
  SessionCandidateSource,
} from '@/domains/dj-studio/session-builder/types'

function compareCandidatesStable(
  left: SessionCandidate,
  right: SessionCandidate,
): number {
  if (right.score !== left.score) {
    return right.score - left.score
  }
  return left.libraryItemId.localeCompare(right.libraryItemId)
}

function applyArtistDiversityPass(
  ranked: SessionCandidate[],
): SessionCandidate[] {
  const targetSize = Math.min(SESSION_CANDIDATE_SHORTLIST_MAX, ranked.length)
  const selected: SessionCandidate[] = []
  const skipped: SessionCandidate[] = []
  const artistCounts = new Map<string, number>()

  const wouldExceedCap = (candidate: SessionCandidate): boolean => {
    for (const artist of candidate.artists) {
      const count = artistCounts.get(artist.id) ?? 0
      if (count >= SESSION_CANDIDATE_ARTIST_CAP) {
        return true
      }
    }
    return false
  }

  const recordArtists = (candidate: SessionCandidate): void => {
    for (const artist of candidate.artists) {
      artistCounts.set(artist.id, (artistCounts.get(artist.id) ?? 0) + 1)
    }
  }

  for (const candidate of ranked) {
    if (selected.length >= targetSize) {
      break
    }
    if (wouldExceedCap(candidate)) {
      skipped.push(candidate)
      continue
    }
    selected.push(candidate)
    recordArtists(candidate)
  }

  if (selected.length < targetSize) {
    for (const candidate of skipped) {
      if (selected.length >= targetSize) {
        break
      }
      selected.push(candidate)
    }
  }

  return selected
}

/**
 * Pure shortlist builder: hard filter → score → stable sort → diversity pass.
 */
export function buildSessionCandidateShortlistFromSources(
  sources: SessionCandidateSource[],
  input: CandidateSelectionInput,
): SessionCandidate[] {
  const eligible = sources.filter((source) =>
    passesHardBpmFilter(source.effectiveBpm, input.bpm),
  )

  if (eligible.length < SESSION_CANDIDATE_MIN_ELIGIBLE) {
    throw new DjStudioError(
      DJ_STUDIO_ERROR_CODES.INSUFFICIENT_SESSION_CANDIDATES,
      `Insufficient LIBRARY candidates after hard filters (${eligible.length})`,
      { availableCount: eligible.length },
    )
  }

  const ranges = buildRelativeNormalizationRanges(eligible)
  const scored = eligible
    .map((candidate) => scoreSessionCandidate(candidate, input, ranges))
    .sort(compareCandidatesStable)

  return applyArtistDiversityPass(scored)
}
