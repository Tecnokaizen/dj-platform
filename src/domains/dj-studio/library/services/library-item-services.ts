import 'server-only'

import { z } from 'zod'

import { Prisma } from '@/generated/prisma/client'
import { prisma } from '@/lib/prisma'
import { DJ_STUDIO_PERMISSION_KEYS } from '@/domains/dj-studio/permissions/permission-keys'
import { requireDjStudioPermission } from '@/domains/dj-studio/permissions/require-dj-studio-permission'
import type { ActiveOrganizationContext } from '@/domains/dj-studio/organization/types'
import {
  DJ_STUDIO_ERROR_CODES,
  DjStudioError,
} from '@/domains/dj-studio/shared/errors'

const smallIntSchema = z.number().int().min(0).max(32767).nullable().optional()
const updateLibraryItemSchema = z
  .object({
    status: z.enum(['LIBRARY', 'WISHLIST', 'ARCHIVED', 'REJECTED']).optional(),
    rating: smallIntSchema,
    energy: smallIntSchema,
    familiarity: smallIntSchema,
    notes: z.string().max(10_000).nullable().optional(),
    customBpm: z.number().min(0).max(9999.999).nullable().optional(),
    customKey: z.string().max(20).nullable().optional(),
    isFavorite: z.boolean().optional(),
  })
  .strict()

const libraryTrackInclude = {
  track: {
    select: {
      id: true,
      title: true,
      bpm: true,
      musicalKey: true,
      camelotKey: true,
      artists: {
        orderBy: { position: 'asc' as const },
        select: {
          creditedName: true,
          artist: { select: { name: true } },
        },
      },
    },
  },
  tags: {
    include: {
      tag: true,
    },
  },
} as const

export async function listLibraryItems(context: ActiveOrganizationContext) {
  await requireDjStudioPermission(
    context,
    DJ_STUDIO_PERMISSION_KEYS.LIBRARY_READ,
  )

  return prisma.libraryItem.findMany({
    where: { organizationId: context.organizationId },
    orderBy: { dateAdded: 'desc' },
    include: libraryTrackInclude,
  })
}

export async function getLibraryItem(
  context: ActiveOrganizationContext,
  libraryItemId: string,
) {
  await requireDjStudioPermission(
    context,
    DJ_STUDIO_PERMISSION_KEYS.LIBRARY_READ,
  )

  const item = await prisma.libraryItem.findFirst({
    where: {
      id: libraryItemId,
      organizationId: context.organizationId,
    },
  })

  if (!item) {
    throw new DjStudioError(DJ_STUDIO_ERROR_CODES.LIBRARY_ITEM_NOT_FOUND)
  }

  return item
}

export async function addTrackToLibrary(
  context: ActiveOrganizationContext,
  trackId: string,
) {
  await requireDjStudioPermission(
    context,
    DJ_STUDIO_PERMISSION_KEYS.LIBRARY_MANAGE,
  )

  const track = await prisma.track.findUnique({
    where: { id: trackId },
    select: { id: true },
  })

  if (!track) {
    throw new DjStudioError(DJ_STUDIO_ERROR_CODES.TRACK_NOT_FOUND)
  }

  const existing = await prisma.libraryItem.findFirst({
    where: {
      organizationId: context.organizationId,
      trackId,
    },
  })

  if (existing) {
    return existing
  }

  try {
    return await prisma.libraryItem.create({
      data: {
        organizationId: context.organizationId,
        trackId,
        addedByProfileId: context.profileId,
      },
    })
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2002'
    ) {
      const raced = await prisma.libraryItem.findFirst({
        where: {
          organizationId: context.organizationId,
          trackId,
        },
      })

      if (raced) {
        return raced
      }
    }

    throw error
  }
}

export async function updateLibraryItem(
  context: ActiveOrganizationContext,
  libraryItemId: string,
  input: z.infer<typeof updateLibraryItemSchema>,
) {
  await requireDjStudioPermission(
    context,
    DJ_STUDIO_PERMISSION_KEYS.LIBRARY_MANAGE,
  )

  const parsed = updateLibraryItemSchema.parse(input)
  const existing = await prisma.libraryItem.findFirst({
    where: {
      id: libraryItemId,
      organizationId: context.organizationId,
    },
    select: { id: true },
  })

  if (!existing) {
    throw new DjStudioError(DJ_STUDIO_ERROR_CODES.LIBRARY_ITEM_NOT_FOUND)
  }

  return prisma.libraryItem.update({
    where: { id: libraryItemId },
    data: {
      ...(parsed.status !== undefined ? { status: parsed.status } : {}),
      ...(parsed.rating !== undefined ? { rating: parsed.rating } : {}),
      ...(parsed.energy !== undefined ? { energy: parsed.energy } : {}),
      ...(parsed.familiarity !== undefined
        ? { familiarity: parsed.familiarity }
        : {}),
      ...(parsed.notes !== undefined ? { notes: parsed.notes } : {}),
      ...(parsed.customBpm !== undefined
        ? { customBpm: parsed.customBpm }
        : {}),
      ...(parsed.customKey !== undefined ? { customKey: parsed.customKey } : {}),
      ...(parsed.isFavorite !== undefined
        ? { isFavorite: parsed.isFavorite }
        : {}),
    },
  })
}

export async function removeLibraryItem(
  context: ActiveOrganizationContext,
  libraryItemId: string,
) {
  await requireDjStudioPermission(
    context,
    DJ_STUDIO_PERMISSION_KEYS.LIBRARY_MANAGE,
  )

  const existing = await prisma.libraryItem.findFirst({
    where: {
      id: libraryItemId,
      organizationId: context.organizationId,
    },
    select: { id: true },
  })

  if (!existing) {
    throw new DjStudioError(DJ_STUDIO_ERROR_CODES.LIBRARY_ITEM_NOT_FOUND)
  }

  const inUse = await prisma.playlistItem.count({
    where: { libraryItemId },
  })

  if (inUse > 0) {
    throw new DjStudioError(DJ_STUDIO_ERROR_CODES.LIBRARY_ITEM_IN_USE)
  }

  await prisma.libraryItem.delete({ where: { id: libraryItemId } })
}
