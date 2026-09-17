import type { LIBRARY_MANIFEST_VERSION } from '@/domains/dj-studio/library-import/constants'

export type LibraryManifestVersion = typeof LIBRARY_MANIFEST_VERSION

export type ImportWarningCode =
  | 'BPM_BLANK_OR_ZERO'
  | 'BPM_OUT_OF_RANGE'
  | 'BPM_INVALID'
  | 'CAMELOT_INVALID'
  | 'ENERGY_INVALID'
  | 'DURATION_INVALID'
  | 'YEAR_INVALID'
  | 'ISRC_NORMALIZED'
  | 'EXTERNAL_ID_PATH_LIKE'
  | 'METADATA_CONFLICT_PRESERVED'
  | 'ENERGY_FILL_NULL_ONLY'
  | 'NOTES_PRESERVED'
  | 'UNKNOWN_COLUMN_IGNORED'

export type ImportRejectCode =
  | 'MISSING_TITLE'
  | 'MISSING_ARTIST'
  | 'MISSING_EXTERNAL_SOURCE'
  | 'MISSING_EXTERNAL_ID'
  | 'EXTERNAL_ID_PATH_LIKE'
  | 'BATCH_MISMATCH'
  | 'DUPLICATE_IDENTITY_CONFLICT'
  | 'DUPLICATE_IDENTITY_SKIP'
  | 'AMBIGUOUS_ISRC'
  | 'AMBIGUOUS_TITLE_ARTIST'
  | 'AMBIGUOUS_ARTIST'
  | 'UNKNOWN_COLUMN'
  | 'PATH_LIKE_COLUMN'
  | 'INVALID_HEADERS'
  | 'EMPTY_MANIFEST'
  | 'APPLY_HAS_REJECTS'
  | 'STAGING_CONFIRMATION_REQUIRED'
  | 'PRODUCTION_TARGET_REFUSED'
  | 'INVALID_BATCH_ID'
  | 'INVALID_TARGET'

export type ImportWarning = {
  code: ImportWarningCode
  message: string
  field?: string
}

export type NormalizedManifestRow = {
  rowNumber: number
  externalSource: string
  externalId: string
  title: string
  normalizedTitle: string
  artist: string
  normalizedArtist: string
  durationMs: number | null
  bpm: number | null
  camelotKey: string | null
  musicalKey: string | null
  energy: number | null
  genreTags: string[]
  year: number | null
  isrc: string | null
  notes: string | null
  batchId: string | null
  warnings: ImportWarning[]
  rejectCode: ImportRejectCode | null
  rejectMessage: string | null
}

export type RowPlanAction =
  | 'CREATE_TRACK'
  | 'REUSE_TRACK'
  | 'FILL_TRACK_METADATA'
  | 'CREATE_LIBRARY_ITEM'
  | 'REUSE_LIBRARY_ITEM'
  | 'SKIP'
  | 'REJECT'

export type CatalogMatchMethod = 'isrc' | 'title_artist_duration' | 'title_artist' | null

export type TrackFillPlan = {
  durationMs?: number
  bpm?: number
  camelotKey?: string
  musicalKey?: string
  isrc?: string
  releaseDate?: Date
}

export type ImportRowPlan = {
  rowNumber: number
  externalSource: string
  externalId: string
  identityKey: string
  action: RowPlanAction
  warnings: ImportWarning[]
  rejectCode: ImportRejectCode | null
  rejectMessage: string | null
  normalized: NormalizedManifestRow | null
  matchMethod: CatalogMatchMethod
  trackId: string | null
  trackWillCreate: boolean
  trackFill: TrackFillPlan | null
  artistId: string | null
  artistWillCreate: boolean
  libraryItemId: string | null
  libraryItemWillCreate: boolean
  energyPolicy: 'set' | 'fill_null' | 'refresh_batch' | 'none'
  notesPolicy: 'set' | 'fill_null' | 'none'
  genreTags: string[]
}

export type ImportPreviewCounts = {
  total: number
  createTrack: number
  reuseTrack: number
  fillTrackMetadata: number
  createArtist: number
  reuseArtist: number
  createLibraryItem: number
  reuseLibraryItem: number
  createTag: number
  reuseTag: number
  skip: number
  warning: number
  reject: number
}

export type ImportPreview = {
  manifestVersion: LibraryManifestVersion
  manifestHash: string
  batchId: string
  organizationId: string
  profileId: string
  counts: ImportPreviewCounts
  rows: ImportRowPlan[]
  tagNames: string[]
  hasRejects: boolean
}

export type ImportReceipt = {
  manifestVersion: LibraryManifestVersion
  manifestHash: string
  batchId: string
  organizationId: string
  operatorProfileId: string
  timestamp: string
  counts: ImportPreviewCounts
  createdTrackIds: string[]
  reusedTrackIds: string[]
  createdArtistIds: string[]
  reusedArtistIds: string[]
  createdLibraryItemIds: string[]
  reusedLibraryItemIds: string[]
  createdTagIds: string[]
  reusedTagIds: string[]
  warningsSummary: Array<{ code: string; count: number }>
}

export type RollbackPreview = {
  batchId: string
  organizationId: string
  manifestHash: string | null
  libraryItemsToDelete: string[]
  libraryItemsToUntag: string[]
  tagsToDeleteIfUnused: string[]
  tracksToDelete: string[]
  artistsToDelete: string[]
  blockedLibraryItemIds: string[]
  blockedTrackIds: string[]
  blockedArtistIds: string[]
}

export type CatalogTrackCandidate = {
  id: string
  title: string
  normalizedTitle: string
  durationMs: number | null
  bpm: unknown
  musicalKey: string | null
  camelotKey: string | null
  isrc: string | null
  releaseDate: Date | null
  metadata: unknown
  primaryArtistNormalizedName: string | null
}

export type CatalogArtistCandidate = {
  id: string
  name: string
  normalizedName: string
  slug: string
}

export type CatalogLibraryItemCandidate = {
  id: string
  trackId: string
  energy: number | null
  notes: string | null
  rating: number | null
  familiarity: number | null
  isFavorite: boolean
  playCount: number
  lastPlayedAt: Date | null
  tagNormalizedNames: string[]
}

export type CatalogTagCandidate = {
  id: string
  name: string
  normalizedName: string
}
