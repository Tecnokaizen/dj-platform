import { createHash } from 'node:crypto'

import { parse } from 'csv-parse/sync'

import {
  ALL_MANIFEST_COLUMNS,
  LIBRARY_MANIFEST_VERSION,
  PATH_LIKE_COLUMN_NAMES,
  REQUIRED_MANIFEST_COLUMNS,
  type ManifestColumn,
} from '@/domains/dj-studio/library-import/constants'
import type { ImportRejectCode } from '@/domains/dj-studio/library-import/types'

export type RawManifestCellMap = Record<string, string>

export type ParsedManifestCsv = {
  version: typeof LIBRARY_MANIFEST_VERSION
  headers: string[]
  rows: Array<{ rowNumber: number; cells: RawManifestCellMap }>
  rawBytesHash: string
}

export class ManifestParseError extends Error {
  readonly code: ImportRejectCode

  constructor(code: ImportRejectCode, message: string) {
    super(message)
    this.name = 'ManifestParseError'
    this.code = code
  }
}

const KNOWN_COLUMNS = new Set<string>(ALL_MANIFEST_COLUMNS)

function normalizeHeader(header: string): string {
  return header.replace(/^\uFEFF/, '').trim().toLowerCase()
}

function isPathLikeHeader(header: string): boolean {
  return PATH_LIKE_COLUMN_NAMES.has(header)
}

/**
 * Parse UTF-8 CSV bytes for dj-studio-library-manifest.v1.
 * Supports quoted commas/newlines, CRLF/LF, escaped quotes, BOM, empty cells.
 */
export function parseLibraryManifestCsv(input: string | Buffer): ParsedManifestCsv {
  const buffer = typeof input === 'string' ? Buffer.from(input, 'utf8') : input
  const rawBytesHash = createHash('sha256').update(buffer).digest('hex')

  let records: Record<string, string>[]
  try {
    records = parse(buffer, {
      columns: (headers: string[]) => headers.map(normalizeHeader),
      skip_empty_lines: true,
      relax_column_count: false,
      trim: false,
      bom: true,
      cast: false,
      relax_quotes: false,
    }) as Record<string, string>[]
  } catch (error) {
    throw new ManifestParseError(
      'INVALID_HEADERS',
      error instanceof Error ? error.message : 'Failed to parse CSV',
    )
  }

  if (records.length === 0) {
    throw new ManifestParseError('EMPTY_MANIFEST', 'Manifest has no data rows')
  }

  const headers = Object.keys(records[0] ?? {})
  if (headers.length === 0) {
    throw new ManifestParseError('INVALID_HEADERS', 'Manifest has no headers')
  }

  for (const header of headers) {
    if (isPathLikeHeader(header)) {
      throw new ManifestParseError(
        'PATH_LIKE_COLUMN',
        `Path-like column rejected: ${header}`,
      )
    }
    if (!KNOWN_COLUMNS.has(header)) {
      throw new ManifestParseError(
        'UNKNOWN_COLUMN',
        `Unknown manifest column rejected: ${header}`,
      )
    }
  }

  for (const required of REQUIRED_MANIFEST_COLUMNS) {
    if (!headers.includes(required)) {
      throw new ManifestParseError(
        'INVALID_HEADERS',
        `Missing required column: ${required}`,
      )
    }
  }

  const rows = records.map((record, index) => {
    const cells: RawManifestCellMap = {}
    for (const column of ALL_MANIFEST_COLUMNS) {
      if (column in record) {
        cells[column] = record[column] ?? ''
      }
    }
    return { rowNumber: index + 2, cells }
  })

  return {
    version: LIBRARY_MANIFEST_VERSION,
    headers: headers.filter((h): h is ManifestColumn =>
      KNOWN_COLUMNS.has(h),
    ),
    rows,
    rawBytesHash,
  }
}

export function hashNormalizedManifestRows(
  rows: Array<{
    externalSource: string
    externalId: string
    title: string
    artist: string
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
  }>,
): string {
  const payload = JSON.stringify(
    rows.map((row) => ({
      externalSource: row.externalSource,
      externalId: row.externalId,
      title: row.title,
      artist: row.artist,
      durationMs: row.durationMs,
      bpm: row.bpm,
      camelotKey: row.camelotKey,
      musicalKey: row.musicalKey,
      energy: row.energy,
      genreTags: row.genreTags,
      year: row.year,
      isrc: row.isrc,
      notes: row.notes,
      batchId: row.batchId,
    })),
  )
  return createHash('sha256').update(payload, 'utf8').digest('hex')
}
