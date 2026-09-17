import {
  analyzeBpmProgression,
  sumKnownDurations,
} from '@/domains/dj-studio/session-builder/musical-rules'
import {
  buildDomainDraftWarnings,
  mergeDraftWarnings,
} from '@/domains/dj-studio/session-builder/generation/draft-warnings'
import type {
  SessionBuilderDraft,
  SessionBuilderDraftTrack,
} from '@/domains/dj-studio/session-builder/generation/draft-types'
import type { SessionGenerationInput } from '@/domains/dj-studio/session-builder/generation/generation-input'
import type { ValidatedPlaylistGenerationProposal } from '@/domains/dj-studio/session-builder/provider'
import type { SessionCandidate } from '@/domains/dj-studio/session-builder/types'
import {
  DJ_STUDIO_ERROR_CODES,
  DjStudioError,
} from '@/domains/dj-studio/shared/errors'

/**
 * Cumulative start offsets. A null duration freezes subsequent starts at null.
 */
export function computeEstimatedStartMs(
  durationMs: Array<number | null>,
): Array<number | null> {
  const starts: Array<number | null> = []
  let cumulative = 0
  let broken = false

  for (const duration of durationMs) {
    if (broken) {
      starts.push(null)
      continue
    }

    starts.push(cumulative)

    if (typeof duration !== 'number' || !Number.isFinite(duration) || duration < 0) {
      broken = true
    } else {
      cumulative += duration
    }
  }

  return starts
}

/**
 * Pure draft assembly: Provider narrative + authoritative Candidate/P1 metadata.
 */
export function buildSessionBuilderDraft(params: {
  input: SessionGenerationInput
  candidates: SessionCandidate[]
  proposal: ValidatedPlaylistGenerationProposal
}): SessionBuilderDraft {
  const { input, candidates, proposal } = params
  const byId = new Map(
    candidates.map((candidate) => [candidate.libraryItemId, candidate]),
  )

  const orderedProposalTracks = [...proposal.tracks].sort(
    (left, right) => left.position - right.position,
  )

  const enrichedWithoutStarts: Omit<SessionBuilderDraftTrack, 'estimatedStartMs'>[] =
    orderedProposalTracks.map((track) => {
      const candidate = byId.get(track.libraryItemId)
      if (!candidate) {
        throw new DjStudioError(
          DJ_STUDIO_ERROR_CODES.VALIDATION_ERROR,
          'Validated proposal references a candidate missing from the shortlist',
          { libraryItemId: track.libraryItemId },
        )
      }

      return {
        libraryItemId: track.libraryItemId,
        position: track.position,
        title: candidate.title,
        artists: candidate.artists.map((artist) => artist.name),
        bpmEffective: candidate.effectiveBpm,
        camelotEffective: candidate.effectiveCamelotKey,
        energy: candidate.energy,
        durationMs: candidate.durationMs,
        transitionNote: track.transitionNote,
        reason: track.reason,
      }
    })

  const estimatedStarts = computeEstimatedStartMs(
    enrichedWithoutStarts.map((track) => track.durationMs),
  )

  const tracks: SessionBuilderDraftTrack[] = enrichedWithoutStarts.map(
    (track, index) => ({
      ...track,
      estimatedStartMs: estimatedStarts[index] ?? null,
    }),
  )

  const duration = sumKnownDurations(tracks.map((track) => track.durationMs))
  const bpmAnalysis = analyzeBpmProgression(
    tracks.map((track) => track.bpmEffective),
  )
  const domainWarnings = buildDomainDraftWarnings(tracks, duration)
  const warnings = mergeDraftWarnings(domainWarnings, proposal.warnings)

  return {
    title: proposal.title,
    summary: proposal.summary,
    targetDurationMin: input.targetDurationMin,
    estimatedDurationMs: duration.totalMs,
    estimatedDurationMode: duration.mode,
    bpmProgression: {
      start: bpmAnalysis.start,
      end: bpmAnalysis.end,
      classification: bpmAnalysis.shape,
      notes: proposal.bpmProgression.notes,
    },
    energyProgression: proposal.energyProgression,
    tracks,
    warnings,
  }
}
