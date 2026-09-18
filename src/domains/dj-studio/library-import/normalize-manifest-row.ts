import {
  MANIFEST_BPM_MAX,
  MANIFEST_ENERGY_MAX,
  MANIFEST_ENERGY_MIN,
  MANIFEST_GENRE_TAG_SEPARATOR,
} from '@/domains/dj-studio/library-import/constants'
import type { RawManifestCellMap } from '@/domains/dj-studio/library-import/parse-manifest-csv'
import type {
  ImportRejectCode,
  ImportWarning,
  NormalizedManifestRow,
} from '@/domains/dj-studio/library-import/types'
import { parseCamelotKey } from '@/domains/dj-studio/session-builder/musical-rules/camelot'

/** Collapse surrounding/internal whitespace; preserve internal words. */
export function normalizeDisplayText(value: string): string {
  return value.trim().replace(/\s+/g, ' ')
}

export function normalizeMatchKey(value: string): string {
  return normalizeDisplayText(value).toLowerCase()
}

export function normalizeExternalSource(value: string): string {
  return normalizeDisplayText(value).toLowerCase()
}

export function looksLikeFilesystemPath(value: string): boolean {
  const trimmed = value.trim()
  if (trimmed.length === 0) {
    return false
  }
  if (trimmed.includes('/') || trimmed.includes('\\')) {
    return true
  }
  if (/^[a-zA-Z]:/.test(trimmed)) {
    return true
  }
  if (trimmed.startsWith('file:')) {
    return true
  }
  return false
}

export function normalizeIsrc(value: string): string | null {
  const compact = value.trim().toUpperCase().replace(/[\s-]/g, '')
  if (compact.length === 0) {
    return null
  }
  return compact
}

/**
 * Strip leading zeros from Camelot number so `08A` reaches Domain parser as `8A`.
 * Does not invent Camelot from traditional musical keys.
 */
export function normalizeCamelotInput(value: string): string {
  const trimmed = value.trim()
  const match = /^(0*)(\d{1,2})([ABab])$/.exec(trimmed)
  if (!match) {
    return trimmed
  }
  return `${Number(match[2])}${match[3].toUpperCase()}`
}

export function parseManifestCamelot(
  value: string,
): { key: string | null; warning: ImportWarning | null } {
  const trimmed = value.trim()
  if (trimmed.length === 0) {
    return { key: null, warning: null }
  }
  const normalized = normalizeCamelotInput(trimmed)
  const key = parseCamelotKey(normalized)
  if (!key) {
    return {
      key: null,
      warning: {
        code: 'CAMELOT_INVALID',
        message: `Invalid Camelot value: ${trimmed}`,
        field: 'camelot_key',
      },
    }
  }
  return { key, warning: null }
}

export function parseManifestBpm(
  value: string,
): { bpm: number | null; warning: ImportWarning | null } {
  const trimmed = value.trim()
  if (trimmed.length === 0) {
    return { bpm: null, warning: null }
  }

  const numeric = Number(trimmed)
  if (!Number.isFinite(numeric)) {
    return {
      bpm: null,
      warning: {
        code: 'BPM_INVALID',
        message: `Non-numeric BPM: ${trimmed}`,
        field: 'bpm',
      },
    }
  }

  if (numeric === 0) {
    return {
      bpm: null,
      warning: {
        code: 'BPM_BLANK_OR_ZERO',
        message: 'BPM 0 treated as null',
        field: 'bpm',
      },
    }
  }

  if (numeric < 0 || numeric > MANIFEST_BPM_MAX) {
    return {
      bpm: null,
      warning: {
        code: 'BPM_OUT_OF_RANGE',
        message: `BPM out of range (0 exclusive .. ${MANIFEST_BPM_MAX}]: ${trimmed}`,
        field: 'bpm',
      },
    }
  }

  return { bpm: numeric, warning: null }
}

export function parseManifestEnergy(
  value: string,
): { energy: number | null; warning: ImportWarning | null } {
  const trimmed = value.trim()
  if (trimmed.length === 0) {
    return { energy: null, warning: null }
  }

  if (!/^\d+$/.test(trimmed)) {
    return {
      energy: null,
      warning: {
        code: 'ENERGY_INVALID',
        message: `Energy must be integer ${MANIFEST_ENERGY_MIN}..${MANIFEST_ENERGY_MAX}`,
        field: 'energy',
      },
    }
  }

  const energy = Number(trimmed)
  if (energy < MANIFEST_ENERGY_MIN || energy > MANIFEST_ENERGY_MAX) {
    return {
      energy: null,
      warning: {
        code: 'ENERGY_INVALID',
        message: `Energy must be integer ${MANIFEST_ENERGY_MIN}..${MANIFEST_ENERGY_MAX}`,
        field: 'energy',
      },
    }
  }

  return { energy, warning: null }
}

export function parseManifestDurationMs(
  value: string,
): { durationMs: number | null; warning: ImportWarning | null } {
  const trimmed = value.trim()
  if (trimmed.length === 0) {
    return { durationMs: null, warning: null }
  }

  if (!/^\d+$/.test(trimmed)) {
    return {
      durationMs: null,
      warning: {
        code: 'DURATION_INVALID',
        message: `Invalid duration_ms: ${trimmed}`,
        field: 'duration_ms',
      },
    }
  }

  const durationMs = Number(trimmed)
  if (durationMs <= 0) {
    return {
      durationMs: null,
      warning: {
        code: 'DURATION_INVALID',
        message: `duration_ms must be positive: ${trimmed}`,
        field: 'duration_ms',
      },
    }
  }

  return { durationMs, warning: null }
}

export function parseManifestYear(
  value: string,
): { year: number | null; warning: ImportWarning | null } {
  const trimmed = value.trim()
  if (trimmed.length === 0) {
    return { year: null, warning: null }
  }

  if (!/^\d{4}$/.test(trimmed)) {
    return {
      year: null,
      warning: {
        code: 'YEAR_INVALID',
        message: `Invalid year: ${trimmed}`,
        field: 'year',
      },
    }
  }

  const year = Number(trimmed)
  if (year < 1900 || year > 2100) {
    return {
      year: null,
      warning: {
        code: 'YEAR_INVALID',
        message: `Year out of range: ${trimmed}`,
        field: 'year',
      },
    }
  }

  return { year, warning: null }
}

export function parseGenreTags(value: string): string[] {
  if (value.trim().length === 0) {
    return []
  }

  const seen = new Set<string>()
  const tags: string[] = []
  for (const part of value.split(MANIFEST_GENRE_TAG_SEPARATOR)) {
    const display = normalizeDisplayText(part)
    if (display.length === 0) {
      continue
    }
    const key = display.toLowerCase()
    if (seen.has(key)) {
      continue
    }
    seen.add(key)
    tags.push(display)
  }
  return tags
}

export function isValidBatchId(batchId: string): boolean {
  return /^[a-z0-9][a-z0-9._-]{0,63}$/i.test(batchId) && !looksLikeFilesystemPath(batchId)
}

export function normalizeBatchId(batchId: string): string {
  return batchId.trim().toLowerCase()
}

function reject(
  code: ImportRejectCode,
  message: string,
): Pick<NormalizedManifestRow, 'rejectCode' | 'rejectMessage'> {
  return { rejectCode: code, rejectMessage: message }
}

export function normalizeManifestRow(
  rowNumber: number,
  cells: RawManifestCellMap,
  cliBatchId: string,
): NormalizedManifestRow {
  const warnings: ImportWarning[] = []

  const externalSourceRaw = cells.external_source ?? ''
  const externalIdRaw = cells.external_id ?? ''
  const titleRaw = cells.title ?? ''
  const artistRaw = cells.artist ?? ''

  const externalSource = normalizeExternalSource(externalSourceRaw)
  const externalId = normalizeDisplayText(externalIdRaw)
  const title = normalizeDisplayText(titleRaw)
  const artist = normalizeDisplayText(artistRaw)

  let rejectCode: ImportRejectCode | null = null
  let rejectMessage: string | null = null

  if (externalSource.length === 0) {
    ;({ rejectCode, rejectMessage } = reject(
      'MISSING_EXTERNAL_SOURCE',
      'external_source is required',
    ))
  } else if (externalId.length === 0) {
    ;({ rejectCode, rejectMessage } = reject(
      'MISSING_EXTERNAL_ID',
      'external_id is required',
    ))
  } else if (looksLikeFilesystemPath(externalId)) {
    ;({ rejectCode, rejectMessage } = reject(
      'EXTERNAL_ID_PATH_LIKE',
      'external_id must not be a filesystem path',
    ))
  } else if (title.length === 0) {
    ;({ rejectCode, rejectMessage } = reject('MISSING_TITLE', 'title is required'))
  } else if (artist.length === 0) {
    ;({ rejectCode, rejectMessage } = reject(
      'MISSING_ARTIST',
      'artist is required',
    ))
  }

  const bpmResult = parseManifestBpm(cells.bpm ?? '')
  if (bpmResult.warning) {
    warnings.push(bpmResult.warning)
  }

  const camelotResult = parseManifestCamelot(cells.camelot_key ?? '')
  if (camelotResult.warning) {
    warnings.push(camelotResult.warning)
  }

  const energyResult = parseManifestEnergy(cells.energy ?? '')
  if (energyResult.warning) {
    warnings.push(energyResult.warning)
  }

  const durationResult = parseManifestDurationMs(cells.duration_ms ?? '')
  if (durationResult.warning) {
    warnings.push(durationResult.warning)
  }

  const yearResult = parseManifestYear(cells.year ?? '')
  if (yearResult.warning) {
    warnings.push(yearResult.warning)
  }

  const isrcRaw = cells.isrc ?? ''
  const isrc = isrcRaw.trim().length > 0 ? normalizeIsrc(isrcRaw) : null

  const musicalKeyRaw = normalizeDisplayText(cells.musical_key ?? '')
  const musicalKey = musicalKeyRaw.length > 0 ? musicalKeyRaw.slice(0, 20) : null

  const notesRaw = cells.notes ?? ''
  const notes = notesRaw.trim().length > 0 ? notesRaw.trim() : null

  const rowBatchRaw = cells.batch_id ?? ''
  const rowBatch =
    rowBatchRaw.trim().length > 0 ? normalizeBatchId(rowBatchRaw) : null

  if (rowBatch !== null && rowBatch !== cliBatchId) {
    ;({ rejectCode, rejectMessage } = reject(
      'BATCH_MISMATCH',
      `Row batch_id "${rowBatch}" does not match CLI batch "${cliBatchId}"`,
    ))
  }

  return {
    rowNumber,
    externalSource,
    externalId,
    title,
    normalizedTitle: normalizeMatchKey(title),
    artist,
    normalizedArtist: normalizeMatchKey(artist),
    durationMs: durationResult.durationMs,
    bpm: bpmResult.bpm,
    camelotKey: camelotResult.key,
    musicalKey,
    energy: energyResult.energy,
    genreTags: parseGenreTags(cells.genre_tags ?? ''),
    year: yearResult.year,
    isrc,
    notes,
    batchId: rowBatch,
    warnings,
    rejectCode,
    rejectMessage,
  }
}

export function rowIdentityKey(row: {
  externalSource: string
  externalId: string
}): string {
  return `${row.externalSource}\u0000${row.externalId}`
}

/**
 * Detect duplicate external identities. Exact duplicate rows → skip;
 * conflicting data → reject both.
 */
export function markDuplicateIdentities(
  rows: NormalizedManifestRow[],
): NormalizedManifestRow[] {
  const byIdentity = new Map<string, NormalizedManifestRow[]>()

  for (const row of rows) {
    if (row.rejectCode) {
      continue
    }
    const key = rowIdentityKey(row)
    const list = byIdentity.get(key) ?? []
    list.push(row)
    byIdentity.set(key, list)
  }

  const result = rows.map((row) => ({ ...row }))

  for (const [, group] of byIdentity) {
    if (group.length < 2) {
      continue
    }

    const signatures = group.map((row) =>
      JSON.stringify({
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
      }),
    )
    const unique = new Set(signatures)
    const conflicting = unique.size > 1

    for (const source of group) {
      const target = result.find((row) => row.rowNumber === source.rowNumber)
      if (!target || target.rejectCode) {
        continue
      }
      if (conflicting) {
        target.rejectCode = 'DUPLICATE_IDENTITY_CONFLICT'
        target.rejectMessage =
          'Duplicate external_source+external_id with conflicting data'
      } else if (source.rowNumber !== group[0]!.rowNumber) {
        target.rejectCode = 'DUPLICATE_IDENTITY_SKIP'
        target.rejectMessage =
          'Exact duplicate of earlier row with same external identity'
      }
    }
  }

  return result
}
