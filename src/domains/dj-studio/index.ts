/**
 * DJ Studio Domain public surface.
 *
 * Platform Core must not import this module.
 * Domain may import authorized Core contracts and services.
 */

export {
  DJ_STUDIO_PERMISSION_KEYS,
  type DjStudioPermissionKey,
} from '@/domains/dj-studio/permissions/permission-keys'
export { DJ_STUDIO_PERMISSION_DEFINITIONS } from '@/domains/dj-studio/permissions/permission-definitions'
export { seedDjStudioDomainPermissions } from '@/domains/dj-studio/permissions/seed-dj-studio-permissions'
export { requireDjStudioPermission } from '@/domains/dj-studio/permissions/require-dj-studio-permission'
export { hasDjStudioPermission } from '@/domains/dj-studio/permissions/has-dj-studio-permission'

export type { DjStudioProfile } from '@/domains/dj-studio/profile/types'
export {
  getOwnDjStudioProfile,
  upsertOwnDjStudioProfile,
} from '@/domains/dj-studio/profile/index'

export type { LibraryItemRef, TagRef } from '@/domains/dj-studio/library/types'
export {
  listLibraryItems,
  getLibraryItem,
  addTrackToLibrary,
  updateLibraryItem,
  removeLibraryItem,
  listTags,
  createTag,
  addTagToLibraryItem,
  removeTagFromLibraryItem,
} from '@/domains/dj-studio/library/index'

export type {
  PlaylistRef,
  PlaylistItemRef,
} from '@/domains/dj-studio/playlists/types'
export {
  listPlaylists,
  getPlaylist,
  createPlaylist,
  updatePlaylist,
  deletePlaylist,
  addPlaylistItem,
  updatePlaylistItem,
  removePlaylistItem,
  reorderPlaylistItems,
} from '@/domains/dj-studio/playlists/index'

export { searchCatalogTracks } from '@/domains/dj-studio/catalog/index'

export {
  BPM_TOLERANCE_BPM,
  PLAYLIST_GENERATION_PROVIDER_ERROR_CODES,
  SESSION_CANDIDATE_ARTIST_CAP,
  SESSION_CANDIDATE_MIN_ELIGIBLE,
  SESSION_CANDIDATE_SCORE_WEIGHTS,
  SESSION_CANDIDATE_SHORTLIST_MAX,
  PlaylistGenerationProviderError,
  analyzeBpmProgression,
  buildSessionCandidateShortlist,
  buildSessionCandidateShortlistFromSources,
  compareCamelot,
  effectiveBpm,
  effectiveCamelotKey,
  evaluateBpmFit,
  evaluateBpmTransition,
  getTargetBpmAtPosition,
  listSessionLibraryCandidateSources,
  parseCamelotKey,
  parsePlaylistGenerationProviderOutput,
  passesHardBpmFilter,
  playlistGenerationProviderOutputSchema,
  scoreBpmComponent,
  scoreSessionCandidate,
  scoreTagRelevance,
  sumKnownDurations,
  toPlaylistGenerationCandidate,
  toPlaylistGenerationCandidates,
  type BpmDirection,
  type BpmFitResult,
  type BpmFitSeverity,
  type BpmProgressionAnalysis,
  type BpmProgressionShape,
  type BpmTransitionResult,
  type CamelotCompatibility,
  type CamelotKey,
  type CamelotLetter,
  type CandidateSelectionBpmInput,
  type CandidateSelectionInput,
  type DurationAggregation,
  type DurationAggregationMode,
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
  type SessionCandidate,
  type SessionCandidateArtist,
  type SessionCandidateScoreBreakdown,
  type SessionCandidateSource,
  type SessionCandidateTag,
  type SessionEnergyCurve,
  type ValidatedPlaylistGenerationProposal,
} from '@/domains/dj-studio/session-builder'

export {
  DJ_STUDIO_ERROR_CODES,
  DjStudioError,
  type DjStudioErrorCode,
  DJ_STUDIO_PUBLIC_NOTICE_CODES,
  getDjStudioPublicMessage,
  getDjStudioPublicErrorMessage,
  mapDjStudioErrorToPublicNotice,
} from '@/domains/dj-studio/shared/index'

export type { ActiveOrganizationContext } from '@/domains/dj-studio/organization/types'
export type { SelectableOrganization } from '@/domains/dj-studio/organization/index'
export {
  resolveActiveOrganization,
  ensurePersonalOrganization,
  personalOrganizationSlug,
  listSelectableOrganizations,
  switchActiveOrganization,
} from '@/domains/dj-studio/organization/index'
