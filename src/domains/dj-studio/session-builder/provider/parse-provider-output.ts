import {
  PLAYLIST_GENERATION_PROVIDER_ERROR_CODES,
  PlaylistGenerationProviderError,
} from '@/domains/dj-studio/session-builder/provider/provider-errors'
import { playlistGenerationProviderOutputSchema } from '@/domains/dj-studio/session-builder/provider/proposal-schema'
import type { ValidatedPlaylistGenerationProposal } from '@/domains/dj-studio/session-builder/provider/provider-types'

function assertContiguousUniquePositions(
  positions: number[],
): void {
  const seen = new Set<number>()
  for (let expected = 0; expected < positions.length; expected += 1) {
    const position = positions[expected]
    if (position !== expected) {
      throw new PlaylistGenerationProviderError(
        PLAYLIST_GENERATION_PROVIDER_ERROR_CODES.INVALID_PROVIDER_PROPOSAL,
        'Provider track positions must be contiguous 0-based integers',
        { positions },
      )
    }
    if (seen.has(position)) {
      throw new PlaylistGenerationProviderError(
        PLAYLIST_GENERATION_PROVIDER_ERROR_CODES.INVALID_PROVIDER_PROPOSAL,
        'Provider track positions must be unique',
        { positions },
      )
    }
    seen.add(position)
  }
}

/**
 * Parse untrusted provider output against schema + semantic contracts.
 * Rejects entirely on unknown IDs, duplicates, empty tracks, or position gaps.
 */
export function parsePlaylistGenerationProviderOutput(
  raw: unknown,
  allowedCandidateIds: ReadonlySet<string> | readonly string[],
): ValidatedPlaylistGenerationProposal {
  const allowed =
    allowedCandidateIds instanceof Set
      ? allowedCandidateIds
      : new Set(allowedCandidateIds)

  const parsed = playlistGenerationProviderOutputSchema.safeParse(raw)
  if (!parsed.success) {
    throw new PlaylistGenerationProviderError(
      PLAYLIST_GENERATION_PROVIDER_ERROR_CODES.INVALID_PROVIDER_RESPONSE,
      'Provider output failed structural validation',
      { issueCount: parsed.error.issues.length },
    )
  }

  const proposal = parsed.data

  if (proposal.tracks.length === 0) {
    throw new PlaylistGenerationProviderError(
      PLAYLIST_GENERATION_PROVIDER_ERROR_CODES.EMPTY_PROVIDER_PROPOSAL,
      'Provider returned an empty track list',
    )
  }

  const libraryItemIds = proposal.tracks.map((track) => track.libraryItemId)
  const uniqueIds = new Set(libraryItemIds)
  if (uniqueIds.size !== libraryItemIds.length) {
    throw new PlaylistGenerationProviderError(
      PLAYLIST_GENERATION_PROVIDER_ERROR_CODES.INVALID_PROVIDER_PROPOSAL,
      'Provider selected a libraryItemId more than once',
    )
  }

  for (const libraryItemId of libraryItemIds) {
    if (!allowed.has(libraryItemId)) {
      throw new PlaylistGenerationProviderError(
        PLAYLIST_GENERATION_PROVIDER_ERROR_CODES.INVALID_PROVIDER_PROPOSAL,
        'Provider selected a libraryItemId outside the candidate set',
        { libraryItemId },
      )
    }
  }

  const positions = [...proposal.tracks]
    .sort((left, right) => left.position - right.position)
    .map((track) => track.position)

  assertContiguousUniquePositions(positions)

  // Re-order tracks by position for Domain consumers.
  const orderedTracks = [...proposal.tracks].sort(
    (left, right) => left.position - right.position,
  )

  return {
    title: proposal.title,
    summary: proposal.summary,
    tracks: orderedTracks,
    energyProgression: proposal.energyProgression,
    bpmProgression: proposal.bpmProgression,
    warnings: proposal.warnings,
  }
}
