import {
  importBatchTagName,
  importCreatedTagName,
  LIBRARY_MANIFEST_VERSION,
} from '@/domains/dj-studio/library-import/constants'
import {
  createPrismaLibraryImportCatalog,
  decimalToNumber,
  resolveArtist,
  resolveCatalogTrack,
  type LibraryImportCatalogPort,
} from '@/domains/dj-studio/library-import/catalog-resolve'
import {
  isValidBatchId,
  markDuplicateIdentities,
  normalizeBatchId,
  normalizeManifestRow,
  rowIdentityKey,
} from '@/domains/dj-studio/library-import/normalize-manifest-row'
import {
  hashNormalizedManifestRows,
  parseLibraryManifestCsv,
} from '@/domains/dj-studio/library-import/parse-manifest-csv'
import type {
  CatalogTrackCandidate,
  ImportPreview,
  ImportPreviewCounts,
  ImportRowPlan,
  ImportWarning,
  NormalizedManifestRow,
  TrackFillPlan,
} from '@/domains/dj-studio/library-import/types'
import { normalizeTagName } from '@/domains/dj-studio/library/validation/normalize-tag-name'
import type { PrismaClient } from '@/generated/prisma/client'

function emptyCounts(): ImportPreviewCounts {
  return {
    total: 0,
    createTrack: 0,
    reuseTrack: 0,
    fillTrackMetadata: 0,
    createArtist: 0,
    reuseArtist: 0,
    createLibraryItem: 0,
    reuseLibraryItem: 0,
    createTag: 0,
    reuseTag: 0,
    skip: 0,
    warning: 0,
    reject: 0,
  }
}

function yearToReleaseDate(year: number | null): Date | null {
  if (year === null) {
    return null
  }
  return new Date(Date.UTC(year, 0, 1))
}

function buildFillNullPlan(
  existing: CatalogTrackCandidate,
  row: NormalizedManifestRow,
): { fill: TrackFillPlan; warnings: ImportWarning[]; filled: boolean } {
  const fill: TrackFillPlan = {}
  const warnings: ImportWarning[] = []
  let filled = false

  const existingBpm = decimalToNumber(existing.bpm)

  if (row.durationMs !== null) {
    if (existing.durationMs === null) {
      fill.durationMs = row.durationMs
      filled = true
    } else if (existing.durationMs !== row.durationMs) {
      warnings.push({
        code: 'METADATA_CONFLICT_PRESERVED',
        message: `Preserving existing durationMs=${existing.durationMs}; manifest had ${row.durationMs}`,
        field: 'duration_ms',
      })
    }
  }

  if (row.bpm !== null) {
    if (existingBpm === null) {
      fill.bpm = row.bpm
      filled = true
    } else if (existingBpm !== row.bpm) {
      warnings.push({
        code: 'METADATA_CONFLICT_PRESERVED',
        message: `Preserving existing bpm=${existingBpm}; manifest had ${row.bpm}`,
        field: 'bpm',
      })
    }
  }

  if (row.camelotKey !== null) {
    if (existing.camelotKey === null) {
      fill.camelotKey = row.camelotKey
      filled = true
    } else if (existing.camelotKey !== row.camelotKey) {
      warnings.push({
        code: 'METADATA_CONFLICT_PRESERVED',
        message: `Preserving existing camelotKey=${existing.camelotKey}; manifest had ${row.camelotKey}`,
        field: 'camelot_key',
      })
    }
  }

  if (row.musicalKey !== null) {
    if (existing.musicalKey === null) {
      fill.musicalKey = row.musicalKey
      filled = true
    } else if (existing.musicalKey !== row.musicalKey) {
      warnings.push({
        code: 'METADATA_CONFLICT_PRESERVED',
        message: `Preserving existing musicalKey=${existing.musicalKey}; manifest had ${row.musicalKey}`,
        field: 'musical_key',
      })
    }
  }

  if (row.isrc !== null) {
    if (existing.isrc === null) {
      fill.isrc = row.isrc
      filled = true
    } else if (existing.isrc !== row.isrc) {
      warnings.push({
        code: 'METADATA_CONFLICT_PRESERVED',
        message: `Preserving existing isrc=${existing.isrc}; manifest had ${row.isrc}`,
        field: 'isrc',
      })
    }
  }

  const releaseDate = yearToReleaseDate(row.year)
  if (releaseDate && existing.releaseDate === null) {
    fill.releaseDate = releaseDate
    filled = true
  }

  return { fill, warnings, filled }
}

function rejectedPlan(
  row: NormalizedManifestRow,
  overrides?: Partial<ImportRowPlan>,
): ImportRowPlan {
  return {
    rowNumber: row.rowNumber,
    externalSource: row.externalSource,
    externalId: row.externalId,
    identityKey: rowIdentityKey(row),
    action: 'REJECT',
    warnings: row.warnings,
    rejectCode: row.rejectCode,
    rejectMessage: row.rejectMessage,
    normalized: row,
    matchMethod: null,
    trackId: null,
    trackWillCreate: false,
    trackFill: null,
    artistId: null,
    artistWillCreate: false,
    libraryItemId: null,
    libraryItemWillCreate: false,
    energyPolicy: 'none',
    notesPolicy: 'none',
    genreTags: row.genreTags,
    ...overrides,
  }
}

async function planRow(
  catalog: LibraryImportCatalogPort,
  organizationId: string,
  batchId: string,
  row: NormalizedManifestRow,
): Promise<ImportRowPlan> {
  if (row.rejectCode === 'DUPLICATE_IDENTITY_SKIP') {
    return {
      ...rejectedPlan(row),
      action: 'SKIP',
      rejectCode: 'DUPLICATE_IDENTITY_SKIP',
    }
  }

  if (row.rejectCode) {
    return rejectedPlan(row)
  }

  const warnings = [...row.warnings]
  const catalogResult = await resolveCatalogTrack(catalog, {
    isrc: row.isrc,
    normalizedTitle: row.normalizedTitle,
    normalizedArtist: row.normalizedArtist,
    durationMs: row.durationMs,
  })

  if (catalogResult.status === 'ambiguous') {
    return rejectedPlan(row, {
      action: 'REJECT',
      rejectCode: catalogResult.code,
      rejectMessage: catalogResult.message,
      warnings,
    })
  }

  let trackId: string | null = null
  let trackWillCreate = false
  let trackFill: TrackFillPlan | null = null
  let matchMethod: ImportRowPlan['matchMethod'] = null
  let artistId: string | null = null
  let artistWillCreate = false
  let fillTrackMetadata = false

  if (catalogResult.status === 'reuse') {
    trackId = catalogResult.track.id
    matchMethod = catalogResult.method
    const fillResult = buildFillNullPlan(catalogResult.track, row)
    warnings.push(...fillResult.warnings)
    if (fillResult.filled) {
      trackFill = fillResult.fill
      fillTrackMetadata = true
    }
  } else {
    trackWillCreate = true
    const artistResult = await resolveArtist(catalog, row.normalizedArtist)
    if (artistResult.status === 'ambiguous') {
      return rejectedPlan(row, {
        rejectCode: 'AMBIGUOUS_ARTIST',
        rejectMessage: artistResult.message,
        warnings,
      })
    }
    if (artistResult.status === 'reuse') {
      artistId = artistResult.artist.id
    } else {
      artistWillCreate = true
    }
  }

  let libraryItemId: string | null = null
  let libraryItemWillCreate = false
  let energyPolicy: ImportRowPlan['energyPolicy'] = 'none'
  let notesPolicy: ImportRowPlan['notesPolicy'] = 'none'

  if (trackId) {
    const existingItem = await catalog.findLibraryItem(organizationId, trackId)
    if (existingItem) {
      libraryItemId = existingItem.id
      const ownsBatch = existingItem.tagNormalizedNames.includes(
        normalizeTagName(importCreatedTagName(batchId)),
      )
      if (row.energy !== null) {
        if (ownsBatch) {
          energyPolicy = 'refresh_batch'
        } else if (existingItem.energy === null) {
          energyPolicy = 'fill_null'
        } else if (existingItem.energy !== row.energy) {
          energyPolicy = 'none'
          warnings.push({
            code: 'ENERGY_FILL_NULL_ONLY',
            message: `Preserving existing energy=${existingItem.energy}; manifest had ${row.energy}`,
            field: 'energy',
          })
        }
      }
      if (row.notes !== null) {
        if (existingItem.notes === null) {
          notesPolicy = 'fill_null'
        } else {
          notesPolicy = 'none'
          warnings.push({
            code: 'NOTES_PRESERVED',
            message: 'Preserving existing non-null notes',
            field: 'notes',
          })
        }
      }
    } else {
      libraryItemWillCreate = true
      energyPolicy = row.energy !== null ? 'set' : 'none'
      notesPolicy = row.notes !== null ? 'set' : 'none'
    }
  } else {
    libraryItemWillCreate = true
    energyPolicy = row.energy !== null ? 'set' : 'none'
    notesPolicy = row.notes !== null ? 'set' : 'none'
  }

  let action: ImportRowPlan['action'] = 'REUSE_TRACK'
  if (trackWillCreate) {
    action = 'CREATE_TRACK'
  } else if (fillTrackMetadata) {
    action = 'FILL_TRACK_METADATA'
  } else if (libraryItemWillCreate) {
    action = 'CREATE_LIBRARY_ITEM'
  } else {
    action = 'REUSE_LIBRARY_ITEM'
  }

  return {
    rowNumber: row.rowNumber,
    externalSource: row.externalSource,
    externalId: row.externalId,
    identityKey: rowIdentityKey(row),
    action,
    warnings,
    rejectCode: null,
    rejectMessage: null,
    normalized: row,
    matchMethod,
    trackId,
    trackWillCreate,
    trackFill,
    artistId,
    artistWillCreate,
    libraryItemId,
    libraryItemWillCreate,
    energyPolicy,
    notesPolicy,
    genreTags: row.genreTags,
  }
}

function accumulateCounts(
  rows: ImportRowPlan[],
  tagCreate: number,
  tagReuse: number,
): ImportPreviewCounts {
  const counts = emptyCounts()
  counts.total = rows.length
  counts.createTag = tagCreate
  counts.reuseTag = tagReuse

  const artistsCreating = new Set<string>()
  let createArtist = 0
  let reuseArtist = 0

  for (const row of rows) {
    if (row.warnings.length > 0) {
      counts.warning += 1
    }
    if (row.action === 'REJECT') {
      counts.reject += 1
      continue
    }
    if (row.action === 'SKIP') {
      counts.skip += 1
      continue
    }
    if (row.trackWillCreate) {
      counts.createTrack += 1
    } else if (row.trackId) {
      counts.reuseTrack += 1
    }
    if (row.trackFill && Object.keys(row.trackFill).length > 0) {
      counts.fillTrackMetadata += 1
    }
    if (row.artistWillCreate) {
      const key = row.normalized?.normalizedArtist ?? row.identityKey
      if (!artistsCreating.has(key)) {
        artistsCreating.add(key)
        createArtist += 1
      }
    } else if (row.artistId) {
      reuseArtist += 1
    }
    if (row.libraryItemWillCreate) {
      counts.createLibraryItem += 1
    } else if (row.libraryItemId) {
      counts.reuseLibraryItem += 1
    }
  }

  counts.createArtist = createArtist
  counts.reuseArtist = reuseArtist
  return counts
}

export type PreviewImportInput = {
  csv: string | Buffer
  batchId: string
  organizationId: string
  profileId: string
  catalog: LibraryImportCatalogPort
}

/**
 * PREVIEW: pure planning against read-only catalog port. ZERO writes.
 */
export async function previewLibraryManifestImport(
  input: PreviewImportInput,
): Promise<ImportPreview> {
  if (!isValidBatchId(input.batchId)) {
    throw new Error('INVALID_BATCH_ID: batch id must be a safe slug-like identifier')
  }
  const batchId = normalizeBatchId(input.batchId)

  const parsed = parseLibraryManifestCsv(input.csv)
  const normalized = markDuplicateIdentities(
    parsed.rows.map((row) =>
      normalizeManifestRow(row.rowNumber, row.cells, batchId),
    ),
  )

  const plans: ImportRowPlan[] = []
  for (const row of normalized) {
    plans.push(await planRow(input.catalog, input.organizationId, batchId, row))
  }

  const batchTag = importBatchTagName(batchId)
  const createdTag = importCreatedTagName(batchId)
  const genreTagNames = new Set<string>()
  for (const plan of plans) {
    if (plan.action === 'REJECT' || plan.action === 'SKIP') {
      continue
    }
    for (const tag of plan.genreTags) {
      genreTagNames.add(tag)
    }
  }

  const allTagNames = [batchTag, createdTag, ...genreTagNames]
  const normalizedTagNames = allTagNames.map((name) => normalizeTagName(name))
  const existingTags = await input.catalog.findTagsByNormalizedNames(
    input.organizationId,
    normalizedTagNames,
  )
  const existingNormalized = new Set(
    existingTags.map((tag) => tag.normalizedName),
  )
  let createTag = 0
  let reuseTag = 0
  for (const name of normalizedTagNames) {
    if (existingNormalized.has(name)) {
      reuseTag += 1
    } else {
      createTag += 1
    }
  }

  const acceptedNormalized = normalized
    .filter((row) => !row.rejectCode || row.rejectCode === 'DUPLICATE_IDENTITY_SKIP')
    .map((row) => ({
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
    }))

  return {
    manifestVersion: LIBRARY_MANIFEST_VERSION,
    manifestHash: hashNormalizedManifestRows(acceptedNormalized) || parsed.rawBytesHash,
    batchId,
    organizationId: input.organizationId,
    profileId: input.profileId,
    counts: accumulateCounts(plans, createTag, reuseTag),
    rows: plans,
    tagNames: allTagNames,
    hasRejects: plans.some((row) => row.action === 'REJECT'),
  }
}

export async function previewLibraryManifestImportWithPrisma(input: {
  csv: string | Buffer
  batchId: string
  organizationId: string
  profileId: string
  prisma: PrismaClient
}): Promise<ImportPreview> {
  return previewLibraryManifestImport({
    csv: input.csv,
    batchId: input.batchId,
    organizationId: input.organizationId,
    profileId: input.profileId,
    catalog: createPrismaLibraryImportCatalog(input.prisma),
  })
}
