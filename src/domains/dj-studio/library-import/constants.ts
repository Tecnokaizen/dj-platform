/**
 * DJ Studio library manifest import — V1 constants.
 */

export const LIBRARY_MANIFEST_VERSION = 'dj-studio-library-manifest.v1' as const

/** Conservative tolerance for rounded DJ export durations. */
export const TRACK_DURATION_TOLERANCE_MS = 2000

export const MANIFEST_GENRE_TAG_SEPARATOR = '|' as const

export const MANIFEST_ENERGY_MIN = 1
export const MANIFEST_ENERGY_MAX = 10

export const MANIFEST_BPM_MAX = 400

/** Stable metadata namespace on Track.metadata (created tracks only). */
export const DJ_STUDIO_IMPORT_METADATA_KEY = 'djStudioImport' as const

export const IMPORT_TAG_PREFIX = 'import:' as const
export const IMPORT_CREATED_TAG_PREFIX = 'import-created:' as const

export function importBatchTagName(batchId: string): string {
  return `${IMPORT_TAG_PREFIX}${batchId}`
}

export function importCreatedTagName(batchId: string): string {
  return `${IMPORT_CREATED_TAG_PREFIX}${batchId}`
}

export const REQUIRED_MANIFEST_COLUMNS = [
  'external_source',
  'external_id',
  'title',
  'artist',
] as const

export const OPTIONAL_MANIFEST_COLUMNS = [
  'duration_ms',
  'bpm',
  'camelot_key',
  'musical_key',
  'energy',
  'genre_tags',
  'year',
  'isrc',
  'notes',
  'batch_id',
] as const

export const ALL_MANIFEST_COLUMNS = [
  ...REQUIRED_MANIFEST_COLUMNS,
  ...OPTIONAL_MANIFEST_COLUMNS,
] as const

export type ManifestColumn = (typeof ALL_MANIFEST_COLUMNS)[number]

export const PATH_LIKE_COLUMN_NAMES = new Set([
  'path',
  'location',
  'file',
  'filename',
  'file_name',
  'file name',
  'filepath',
  'file_path',
  'local_path',
])
