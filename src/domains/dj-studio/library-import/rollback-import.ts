import 'server-only'

import type { PrismaClient } from '@/generated/prisma/client'
import {
  importBatchTagName,
  importCreatedTagName,
} from '@/domains/dj-studio/library-import/constants'
import { LibraryImportApplyError } from '@/domains/dj-studio/library-import/errors'
import { requireImporterAuthorization } from '@/domains/dj-studio/library-import/resolve-operator-context'
import type { ImportReceipt, RollbackPreview } from '@/domains/dj-studio/library-import/types'
import { normalizeTagName } from '@/domains/dj-studio/library/validation/normalize-tag-name'

function assertStagingGate(confirmTarget: string | undefined): void {
  if (confirmTarget === 'production') {
    throw new LibraryImportApplyError(
      'PRODUCTION_TARGET_REFUSED',
      'Production rollback is refused for DJ-STUDIO-004 V1',
    )
  }
  if (confirmTarget !== 'staging') {
    throw new LibraryImportApplyError(
      'STAGING_CONFIRMATION_REQUIRED',
      'Rollback apply requires --confirm-target staging',
    )
  }
}

export async function previewLibraryImportRollback(input: {
  prisma: PrismaClient
  organizationId: string
  profileId: string
  receipt: ImportReceipt
}): Promise<RollbackPreview> {
  await requireImporterAuthorization({
    prisma: input.prisma,
    organizationId: input.organizationId,
    profileId: input.profileId,
  })

  if (input.receipt.organizationId !== input.organizationId) {
    throw new LibraryImportApplyError(
      'RECEIPT_ORG_MISMATCH',
      'Receipt organizationId does not match target organization',
    )
  }

  const batchId = input.receipt.batchId
  const batchTagNormalized = normalizeTagName(importBatchTagName(batchId))
  const createdTagNormalized = normalizeTagName(importCreatedTagName(batchId))

  const createdLibraryItemIds = new Set(input.receipt.createdLibraryItemIds)
  const reusedLibraryItemIds = new Set(input.receipt.reusedLibraryItemIds)
  const allTouchedIds = [...createdLibraryItemIds, ...reusedLibraryItemIds]

  const libraryItems = allTouchedIds.length
    ? await input.prisma.libraryItem.findMany({
        where: {
          organizationId: input.organizationId,
          id: { in: allTouchedIds },
        },
        select: {
          id: true,
          trackId: true,
          _count: { select: { playlistItems: true } },
        },
      })
    : []

  const libraryItemsToDelete: string[] = []
  const libraryItemsToUntag: string[] = []
  const blockedLibraryItemIds: string[] = []

  for (const item of libraryItems) {
    if (createdLibraryItemIds.has(item.id)) {
      if (item._count.playlistItems > 0) {
        blockedLibraryItemIds.push(item.id)
        libraryItemsToUntag.push(item.id)
      } else {
        libraryItemsToDelete.push(item.id)
      }
    } else {
      libraryItemsToUntag.push(item.id)
    }
  }

  const createdTrackIds = [...input.receipt.createdTrackIds]
  const blockedTrackIds: string[] = []
  const tracksToDelete: string[] = []

  for (const trackId of createdTrackIds) {
    const remaining = await input.prisma.libraryItem.count({
      where: { trackId },
    })
    const remainingAfterDelete = await input.prisma.libraryItem.count({
      where: {
        trackId,
        id: { notIn: libraryItemsToDelete },
      },
    })
    // Also count playlist references via library items we keep
    void remaining
    if (remainingAfterDelete > 0) {
      blockedTrackIds.push(trackId)
    } else {
      tracksToDelete.push(trackId)
    }
  }

  const createdArtistIds = [...input.receipt.createdArtistIds]
  const blockedArtistIds: string[] = []
  const artistsToDelete: string[] = []

  for (const artistId of createdArtistIds) {
    const relations = await input.prisma.trackArtist.count({
      where: {
        artistId,
        trackId: { notIn: tracksToDelete },
      },
    })
    if (relations > 0) {
      blockedArtistIds.push(artistId)
    } else {
      // Will only delete if all their track_artists are on tracks being deleted
      const anyOther = await input.prisma.trackArtist.count({
        where: { artistId },
      })
      const onlyOnDeletedTracks = await input.prisma.trackArtist.count({
        where: {
          artistId,
          trackId: { in: tracksToDelete },
        },
      })
      if (anyOther === onlyOnDeletedTracks) {
        artistsToDelete.push(artistId)
      } else {
        blockedArtistIds.push(artistId)
      }
    }
  }

  const batchTags = await input.prisma.tag.findMany({
    where: {
      organizationId: input.organizationId,
      normalizedName: { in: [batchTagNormalized, createdTagNormalized] },
    },
    select: { id: true, normalizedName: true },
  })

  const tagsToDeleteIfUnused = batchTags.map((tag) => tag.id)

  return {
    batchId,
    organizationId: input.organizationId,
    manifestHash: input.receipt.manifestHash,
    libraryItemsToDelete,
    libraryItemsToUntag,
    tagsToDeleteIfUnused,
    tracksToDelete,
    artistsToDelete,
    blockedLibraryItemIds,
    blockedTrackIds,
    blockedArtistIds,
  }
}

export async function applyLibraryImportRollback(input: {
  prisma: PrismaClient
  organizationId: string
  profileId: string
  receipt: ImportReceipt
  confirmTarget: string | undefined
}): Promise<RollbackPreview> {
  assertStagingGate(input.confirmTarget)

  const preview = await previewLibraryImportRollback({
    prisma: input.prisma,
    organizationId: input.organizationId,
    profileId: input.profileId,
    receipt: input.receipt,
  })

  const batchId = preview.batchId
  const batchTagNormalized = normalizeTagName(importBatchTagName(batchId))
  const createdTagNormalized = normalizeTagName(importCreatedTagName(batchId))

  await input.prisma.$transaction(async (tx) => {
    const markerTags = await tx.tag.findMany({
      where: {
        organizationId: input.organizationId,
        normalizedName: { in: [batchTagNormalized, createdTagNormalized] },
      },
      select: { id: true },
    })
    const markerTagIds = markerTags.map((tag) => tag.id)

    if (markerTagIds.length > 0 && preview.libraryItemsToUntag.length > 0) {
      await tx.libraryItemTag.deleteMany({
        where: {
          organizationId: input.organizationId,
          libraryItemId: { in: preview.libraryItemsToUntag },
          tagId: { in: markerTagIds },
        },
      })
    }

    if (preview.libraryItemsToDelete.length > 0) {
      await tx.libraryItemTag.deleteMany({
        where: {
          organizationId: input.organizationId,
          libraryItemId: { in: preview.libraryItemsToDelete },
        },
      })
      await tx.libraryItem.deleteMany({
        where: {
          organizationId: input.organizationId,
          id: { in: preview.libraryItemsToDelete },
        },
      })
    }

    if (preview.tracksToDelete.length > 0) {
      await tx.trackArtist.deleteMany({
        where: { trackId: { in: preview.tracksToDelete } },
      })
      await tx.track.deleteMany({
        where: { id: { in: preview.tracksToDelete } },
      })
    }

    if (preview.artistsToDelete.length > 0) {
      await tx.artist.deleteMany({
        where: { id: { in: preview.artistsToDelete } },
      })
    }

    for (const tagId of preview.tagsToDeleteIfUnused) {
      const remaining = await tx.libraryItemTag.count({ where: { tagId } })
      if (remaining === 0) {
        await tx.tag.delete({ where: { id: tagId } })
      }
    }
  })

  return preview
}
