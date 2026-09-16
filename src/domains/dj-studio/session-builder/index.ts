/**
 * Session Builder Domain surface (DJ-STUDIO-002).
 *
 * P1: musical-rules. P2: candidate engine shortlist (library.read, no AI).
 * P3: PlaylistGenerationProvider contract + untrusted output validation.
 * P4: Generation orchestration (read-only ephemeral draft).
 */

export {
  BPM_TOLERANCE_BPM,
  analyzeBpmProgression,
  compareCamelot,
  effectiveBpm,
  effectiveCamelotKey,
  evaluateBpmFit,
  evaluateBpmTransition,
  getTargetBpmAtPosition,
  parseCamelotKey,
  sumKnownDurations,
  type BpmDirection,
  type BpmFitResult,
  type BpmFitSeverity,
  type BpmProgressionAnalysis,
  type BpmProgressionShape,
  type BpmTransitionResult,
  type CamelotCompatibility,
  type CamelotKey,
  type CamelotLetter,
  type DurationAggregation,
  type DurationAggregationMode,
} from '@/domains/dj-studio/session-builder/musical-rules'

export {
  SESSION_CANDIDATE_ARTIST_CAP,
  SESSION_CANDIDATE_MIN_ELIGIBLE,
  SESSION_CANDIDATE_SCORE_WEIGHTS,
  SESSION_CANDIDATE_SHORTLIST_MAX,
  buildSessionCandidateShortlistFromSources,
  passesHardBpmFilter,
  scoreBpmComponent,
  scoreSessionCandidate,
  scoreTagRelevance,
} from '@/domains/dj-studio/session-builder/candidate-engine'

export { buildSessionCandidateShortlist } from '@/domains/dj-studio/session-builder/services/build-session-candidate-shortlist'
export { listSessionLibraryCandidateSources } from '@/domains/dj-studio/session-builder/services/list-session-library-candidates'
export { generateSessionProposal } from '@/domains/dj-studio/session-builder/services/generate-session-proposal'
export {
  SESSION_BUILDER_GENERATED_BY,
  SESSION_BUILDER_GENERATION_VERSION,
  saveSessionBuilderDraftAsPlaylist,
} from '@/domains/dj-studio/session-builder/services/save-session-builder-playlist'
export {
  parseSessionBuilderSaveInput,
  sessionBuilderSaveInputSchema,
  type SessionBuilderSaveInput,
} from '@/domains/dj-studio/session-builder/services/save-session-builder-playlist-input'

export {
  buildDomainDraftWarnings,
  buildSessionBuilderDraft,
  computeEstimatedStartMs,
  generateSessionProposalFromShortlist,
  mergeDraftWarnings,
  parseSessionGenerationInput,
  sessionGenerationInputSchema,
  toCandidateSelectionInput,
  type SessionBuilderDraft,
  type SessionBuilderDraftBpmProgression,
  type SessionBuilderDraftTrack,
  type SessionBuilderDraftWarning,
  type SessionGenerationInput,
} from '@/domains/dj-studio/session-builder/generation'

export {
  PLAYLIST_GENERATION_PROVIDER_ERROR_CODES,
  PlaylistGenerationProviderError,
  parsePlaylistGenerationProviderOutput,
  playlistGenerationProviderOutputSchema,
  toPlaylistGenerationCandidate,
  toPlaylistGenerationCandidates,
  type PlaylistGenerationBpmInput,
  type PlaylistGenerationBpmProgression,
  type PlaylistGenerationCandidate,
  type PlaylistGenerationEnergyCurve,
  type PlaylistGenerationProvider,
  type PlaylistGenerationProviderErrorCode,
  type PlaylistGenerationRequest,
  type PlaylistGenerationResult,
  type PlaylistGenerationTrack,
  type PlaylistGenerationWarning,
  type PlaylistGenerationWarningSeverity,
  type RawPlaylistGenerationOutput,
  type ValidatedPlaylistGenerationProposal,
} from '@/domains/dj-studio/session-builder/provider'

export type {
  CandidateSelectionBpmInput,
  CandidateSelectionInput,
  SessionCandidate,
  SessionCandidateArtist,
  SessionCandidateScoreBreakdown,
  SessionCandidateSource,
  SessionCandidateTag,
  SessionEnergyCurve,
} from '@/domains/dj-studio/session-builder/types'
