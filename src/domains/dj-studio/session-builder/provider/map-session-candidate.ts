import type { SessionCandidate } from '@/domains/dj-studio/session-builder/types'
import type { PlaylistGenerationCandidate } from '@/domains/dj-studio/session-builder/provider/provider-types'

/**
 * Map Domain shortlist DTO → provider candidate snapshot (no tenancy leakage).
 */
export function toPlaylistGenerationCandidate(
  candidate: SessionCandidate,
): PlaylistGenerationCandidate {
  return {
    libraryItemId: candidate.libraryItemId,
    title: candidate.title,
    artists: candidate.artists.map((artist) => artist.name),
    effectiveBpm: candidate.effectiveBpm,
    effectiveCamelotKey: candidate.effectiveCamelotKey,
    durationMs: candidate.durationMs,
    energy: candidate.energy,
    rating: candidate.rating,
    familiarity: candidate.familiarity,
    isFavorite: candidate.isFavorite,
    tags: candidate.tags.map((tag) => tag.name),
    candidateScore: candidate.score,
  }
}

export function toPlaylistGenerationCandidates(
  candidates: SessionCandidate[],
): PlaylistGenerationCandidate[] {
  return candidates.map(toPlaylistGenerationCandidate)
}
