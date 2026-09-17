import 'server-only'

import { randomUUID } from 'node:crypto'

import {
  ArtistRole,
  Prisma,
  type PrismaClient,
} from '@/generated/prisma/client'
import {
  DJ_STUDIO_IMPORT_METADATA_KEY,
  importBatchTagName,
  importCreatedTagName,
} from '@/domains/dj-studio/library-import/constants'
import { createPrismaLibraryImportCatalog } from '@/domains/dj-studio/library-import/catalog-resolve'
import { LibraryImportApplyError } from '@/domains/dj-studio/library-import/errors'
import { previewLibraryManifestImport } from '@/domains/dj-studio/library-import/preview-import'
import { requireImporterAuthorization } from '@/domains/dj-studio/library-import/resolve-operator-context'
import type {
  ImportPreview,
  ImportReceipt,
  ImportRowPlan,
  TrackFillPlan,
} from '@/domains/dj-studio/library-import/types'
import { normalizeTagName } from '@/domains/dj-studio/library/validation/normalize-tag-name'


export type ApplyTarget = 'staging' | 'production'

function assertStagingGate(confirmTarget: string | undefined): void {
  if (confirmTarget === 'production') {
    throw new LibraryImportApplyError(
      'PRODUCTION_TARGET_REFUSED',
      'Production apply is refused for DJ-STUDIO-004 V1',
    )
  }
  if (confirmTarget !== 'staging') {
    throw new LibraryImportApplyError(
      'STAGING_CONFIRMATION_REQUIRED',
      'Apply requires --confirm-target staging',
    )
  }
}

function slugifyArtistName(name: string): string {
  const base = name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 200)

  return base.length >= 1 ? base : `artist-${randomUUID().slice(0, 8)}`
}

function yearToReleaseDate(year: number | null): Date | null {
  if (year === null) {
    return null
  }
  return new Date(Date.UTC(year, 0, 1))
}

function fillDataFromPlan(fill: TrackFillPlan): Prisma.TrackUpdateInput {
  return {
    ...(fill.durationMs !== undefined ? { durationMs: fill.durationMs } : {}),
    ...(fill.bpm !== undefined ? { bpm: fill.bpm } : {}),
    ...(fill.camelotKey !== undefined ? { camelotKey: fill.camelotKey } : {}),
    ...(fill.musicalKey !== undefined ? { musicalKey: fill.musicalKey } : {}),
    ...(fill.isrc !== undefined ? { isrc: fill.isrc } : {}),
    ...(fill.releaseDate !== undefined ? { releaseDate: fill.releaseDate } : {}),
  }
}

async function ensureTag(
  tx: Prisma.TransactionClient,
  organizationId: string,
  name: string,
  cache: Map<string, { id: string; created: boolean }>,
): Promise<{ id: string; created: boolean }> {
  const normalizedName = normalizeTagName(name)
  const cached = cache.get(normalizedName)
  if (cached) {
    return cached
  }

  const existing = await tx.tag.findUnique({
    where: {
      organizationId_normalizedName: { organizationId, normalizedName },
    },
    select: { id: true },
  })
  if (existing) {
    const result = { id: existing.id, created: false }
    cache.set(normalizedName, result)
    return result
  }

  const created = await tx.tag.create({
    data: {
      organizationId,
      name: name.trim().slice(0, 80),
      normalizedName,
    },
    select: { id: true },
  })
  const result = { id: created.id, created: true }
  cache.set(normalizedName, result)
  return result
}

async function ensureArtist(
  tx: Prisma.TransactionClient,
  name: string,
  normalizedName: string,
  cache: Map<string, { id: string; created: boolean }>,
): Promise<{ id: string; created: boolean }> {
  const cached = cache.get(normalizedName)
  if (cached) {
    return cached
  }

  const existing = await tx.artist.findMany({
    where: { normalizedName },
    select: { id: true },
  })
  if (existing.length === 1) {
    const result = { id: existing[0]!.id, created: false }
    cache.set(normalizedName, result)
    return result
  }
  if (existing.length > 1) {
    throw new LibraryImportApplyError(
      'AMBIGUOUS_ARTIST',
      `Ambiguous artist during apply: ${normalizedName}`,
    )
  }

  let slug = slugifyArtistName(name)
  const slugTaken = await tx.artist.findUnique({
    where: { slug },
    select: { id: true },
  })
  if (slugTaken) {
    slug = `${slug.slice(0, 190)}-${randomUUID().slice(0, 8)}`
  }

  const created = await tx.artist.create({
    data: {
      name,
      normalizedName,
      slug,
    },
    select: { id: true },
  })
  const result = { id: created.id, created: true }
  cache.set(normalizedName, result)
  return result
}

async function applyRow(
  tx: Prisma.TransactionClient,
  organizationId: string,
  profileId: string,
  batchId: string,
  plan: ImportRowPlan,
  caches: {
    artists: Map<string, { id: string; created: boolean }>
    tags: Map<string, { id: string; created: boolean }>
  },
  receipt: {
    createdTrackIds: string[]
    reusedTrackIds: string[]
    createdArtistIds: string[]
    reusedArtistIds: string[]
    createdLibraryItemIds: string[]
    reusedLibraryItemIds: string[]
    createdTagIds: string[]
    reusedTagIds: string[]
  },
): Promise<void> {
  if (plan.action === 'REJECT' || plan.action === 'SKIP' || !plan.normalized) {
    return
  }

  const row = plan.normalized
  let trackId = plan.trackId

  if (plan.trackWillCreate) {
    const artist = await ensureArtist(
      tx,
      row.artist,
      row.normalizedArtist,
      caches.artists,
    )
    if (artist.created) {
      receipt.createdArtistIds.push(artist.id)
    } else {
      receipt.reusedArtistIds.push(artist.id)
    }

    const metadata = {
      [DJ_STUDIO_IMPORT_METADATA_KEY]: {
        version: 1,
        createdBatchId: batchId,
        externalSource: row.externalSource,
        externalId: row.externalId,
      },
    }

    const track = await tx.track.create({
      data: {
        title: row.title,
        normalizedTitle: row.normalizedTitle,
        durationMs: row.durationMs,
        bpm: row.bpm,
        camelotKey: row.camelotKey,
        musicalKey: row.musicalKey,
        isrc: row.isrc,
        releaseDate: yearToReleaseDate(row.year),
        metadata,
        artists: {
          create: {
            artistId: artist.id,
            role: ArtistRole.PRIMARY,
            position: 0,
            creditedName: row.artist,
          },
        },
      },
      select: { id: true },
    })
    trackId = track.id
    receipt.createdTrackIds.push(track.id)
  } else if (trackId) {
    receipt.reusedTrackIds.push(trackId)
    if (plan.trackFill && Object.keys(plan.trackFill).length > 0) {
      await tx.track.update({
        where: { id: trackId },
        data: fillDataFromPlan(plan.trackFill),
      })
    }
  }

  if (!trackId) {
    throw new LibraryImportApplyError(
      'APPLY_MISSING_TRACK',
      `Row ${plan.rowNumber} missing track id after apply planning`,
    )
  }

  let libraryItemId = plan.libraryItemId
  if (plan.libraryItemWillCreate) {
    const created = await tx.libraryItem.create({
      data: {
        organizationId,
        trackId,
        addedByProfileId: profileId,
        status: 'LIBRARY',
        energy: plan.energyPolicy === 'set' ? row.energy : null,
        notes: plan.notesPolicy === 'set' ? row.notes : null,
      },
      select: { id: true },
    })
    libraryItemId = created.id
    receipt.createdLibraryItemIds.push(created.id)
  } else if (libraryItemId) {
    receipt.reusedLibraryItemIds.push(libraryItemId)
    const data: Prisma.LibraryItemUpdateInput = {}
    if (plan.energyPolicy === 'refresh_batch' || plan.energyPolicy === 'fill_null') {
      data.energy = row.energy
    }
    if (plan.notesPolicy === 'fill_null') {
      data.notes = row.notes
    }
    if (Object.keys(data).length > 0) {
      await tx.libraryItem.update({
        where: { id: libraryItemId },
        data,
      })
    }
  }

  if (!libraryItemId) {
    throw new LibraryImportApplyError(
      'APPLY_MISSING_LIBRARY_ITEM',
      `Row ${plan.rowNumber} missing library item id after apply planning`,
    )
  }

  const tagNames = [
    importBatchTagName(batchId),
    ...(plan.libraryItemWillCreate ? [importCreatedTagName(batchId)] : []),
    ...row.genreTags,
  ]

  for (const tagName of tagNames) {
    const tag = await ensureTag(tx, organizationId, tagName, caches.tags)
    if (tag.created) {
      receipt.createdTagIds.push(tag.id)
    } else {
      receipt.reusedTagIds.push(tag.id)
    }

    await tx.libraryItemTag.upsert({
      where: {
        libraryItemId_tagId: {
          libraryItemId,
          tagId: tag.id,
        },
      },
      create: {
        organizationId,
        libraryItemId,
        tagId: tag.id,
      },
      update: {},
    })
  }
}

function summarizeWarnings(preview: ImportPreview): Array<{ code: string; count: number }> {
  const counts = new Map<string, number>()
  for (const row of preview.rows) {
    for (const warning of row.warnings) {
      counts.set(warning.code, (counts.get(warning.code) ?? 0) + 1)
    }
  }
  return [...counts.entries()].map(([code, count]) => ({ code, count }))
}

function unique(ids: string[]): string[] {
  return [...new Set(ids)]
}

export type ApplyLibraryManifestInput = {
  prisma: PrismaClient
  csv: string | Buffer
  batchId: string
  organizationId: string
  profileId: string
  confirmTarget: string | undefined
}

export async function applyLibraryManifestImport(
  input: ApplyLibraryManifestInput,
): Promise<{ preview: ImportPreview; receipt: ImportReceipt }> {
  assertStagingGate(input.confirmTarget)

  await requireImporterAuthorization({
    prisma: input.prisma,
    organizationId: input.organizationId,
    profileId: input.profileId,
  })

  const preview = await previewLibraryManifestImport({
    csv: input.csv,
    batchId: input.batchId,
    organizationId: input.organizationId,
    profileId: input.profileId,
    catalog: createPrismaLibraryImportCatalog(input.prisma),
  })

  if (preview.hasRejects) {
    throw new LibraryImportApplyError(
      'APPLY_HAS_REJECTS',
      'Apply refused because preview contains REJECT rows',
    )
  }

  const receiptBucket = {
    createdTrackIds: [] as string[],
    reusedTrackIds: [] as string[],
    createdArtistIds: [] as string[],
    reusedArtistIds: [] as string[],
    createdLibraryItemIds: [] as string[],
    reusedLibraryItemIds: [] as string[],
    createdTagIds: [] as string[],
    reusedTagIds: [] as string[],
  }

  await input.prisma.$transaction(async (tx) => {
    const caches = {
      artists: new Map<string, { id: string; created: boolean }>(),
      tags: new Map<string, { id: string; created: boolean }>(),
    }

    // Re-plan inside transaction against tx catalog for consistency
    const txPreview = await previewLibraryManifestImport({
      csv: input.csv,
      batchId: input.batchId,
      organizationId: input.organizationId,
      profileId: input.profileId,
      catalog: createPrismaLibraryImportCatalog(tx),
    })

    if (txPreview.hasRejects) {
      throw new LibraryImportApplyError(
        'APPLY_HAS_REJECTS',
        'Apply refused because transactional preview contains REJECT rows',
      )
    }

    if (txPreview.manifestHash !== preview.manifestHash) {
      throw new LibraryImportApplyError(
        'MANIFEST_HASH_MISMATCH',
        'Manifest hash changed between outer preview and transactional preview',
      )
    }

    for (const plan of txPreview.rows) {
      await applyRow(
        tx,
        input.organizationId,
        input.profileId,
        preview.batchId,
        plan,
        caches,
        receiptBucket,
      )
    }
  })

  const receipt: ImportReceipt = {
    manifestVersion: preview.manifestVersion,
    manifestHash: preview.manifestHash,
    batchId: preview.batchId,
    organizationId: preview.organizationId,
    operatorProfileId: preview.profileId,
    timestamp: new Date().toISOString(),
    counts: preview.counts,
    createdTrackIds: unique(receiptBucket.createdTrackIds),
    reusedTrackIds: unique(receiptBucket.reusedTrackIds),
    createdArtistIds: unique(receiptBucket.createdArtistIds),
    reusedArtistIds: unique(receiptBucket.reusedArtistIds),
    createdLibraryItemIds: unique(receiptBucket.createdLibraryItemIds),
    reusedLibraryItemIds: unique(receiptBucket.reusedLibraryItemIds),
    createdTagIds: unique(receiptBucket.createdTagIds),
    reusedTagIds: unique(receiptBucket.reusedTagIds),
    warningsSummary: summarizeWarnings(preview),
  }

  return { preview, receipt }
}
