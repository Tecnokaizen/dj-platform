import 'server-only'

import { z } from 'zod'

import { prisma } from '@/lib/prisma'
import { DJ_STUDIO_PERMISSION_KEYS } from '@/domains/dj-studio/permissions/permission-keys'
import { requireDjStudioPermission } from '@/domains/dj-studio/permissions/require-dj-studio-permission'
import type { ActiveOrganizationContext } from '@/domains/dj-studio/organization/types'
import {
  DJ_STUDIO_ERROR_CODES,
  DjStudioError,
} from '@/domains/dj-studio/shared/errors'

function slugifyPlaylistName(name: string): string {
  const base = name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80)

  return base.length >= 3 ? base : `playlist-${Date.now()}`
}

const createPlaylistSchema = z.object({
  name: z.string().trim().min(1).max(255),
  description: z.string().max(10_000).nullable().optional(),
  slug: z
    .string()
    .trim()
    .min(3)
    .max(255)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
    .optional(),
})

const updatePlaylistSchema = z
  .object({
    name: z.string().trim().min(1).max(255).optional(),
    description: z.string().max(10_000).nullable().optional(),
    slug: z
      .string()
      .trim()
      .min(3)
      .max(255)
      .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
      .nullable()
      .optional(),
  })
  .strict()

const addPlaylistItemSchema = z.object({
  libraryItemId: z.string().uuid(),
  position: z.number().int().min(0).optional(),
  notes: z.string().max(10_000).nullable().optional(),
  transitionNotes: z.string().max(10_000).nullable().optional(),
  sourceTimestampMs: z.number().int().min(0).nullable().optional(),
})

export async function listPlaylists(context: ActiveOrganizationContext) {
  await requireDjStudioPermission(
    context,
    DJ_STUDIO_PERMISSION_KEYS.PLAYLISTS_READ,
  )

  return prisma.playlist.findMany({
    where: { organizationId: context.organizationId },
    orderBy: { updatedAt: 'desc' },
    include: {
      _count: { select: { items: true } },
    },
  })
}

export async function getPlaylist(
  context: ActiveOrganizationContext,
  playlistId: string,
) {
  await requireDjStudioPermission(
    context,
    DJ_STUDIO_PERMISSION_KEYS.PLAYLISTS_READ,
  )

  const playlist = await prisma.playlist.findFirst({
    where: {
      id: playlistId,
      organizationId: context.organizationId,
    },
    include: {
      items: {
        orderBy: { position: 'asc' },
        include: {
          libraryItem: {
            include: {
              track: {
                select: {
                  id: true,
                  title: true,
                  bpm: true,
                  musicalKey: true,
                  camelotKey: true,
                  artists: {
                    orderBy: { position: 'asc' },
                    select: {
                      creditedName: true,
                      artist: { select: { name: true } },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  })

  if (!playlist) {
    throw new DjStudioError(DJ_STUDIO_ERROR_CODES.PLAYLIST_NOT_FOUND)
  }

  return playlist
}

export async function createPlaylist(
  context: ActiveOrganizationContext,
  input: z.infer<typeof createPlaylistSchema>,
) {
  await requireDjStudioPermission(
    context,
    DJ_STUDIO_PERMISSION_KEYS.PLAYLISTS_MANAGE,
  )

  const parsed = createPlaylistSchema.parse(input)

  return prisma.playlist.create({
    data: {
      organizationId: context.organizationId,
      name: parsed.name,
      description: parsed.description ?? null,
      slug: parsed.slug ?? slugifyPlaylistName(parsed.name),
      playlistType: 'MANUAL',
      visibility: 'PRIVATE',
    },
  })
}

export async function updatePlaylist(
  context: ActiveOrganizationContext,
  playlistId: string,
  input: z.infer<typeof updatePlaylistSchema>,
) {
  await requireDjStudioPermission(
    context,
    DJ_STUDIO_PERMISSION_KEYS.PLAYLISTS_MANAGE,
  )

  const parsed = updatePlaylistSchema.parse(input)
  const existing = await prisma.playlist.findFirst({
    where: { id: playlistId, organizationId: context.organizationId },
    select: { id: true },
  })

  if (!existing) {
    throw new DjStudioError(DJ_STUDIO_ERROR_CODES.PLAYLIST_NOT_FOUND)
  }

  return prisma.playlist.update({
    where: { id: playlistId },
    data: {
      ...(parsed.name !== undefined ? { name: parsed.name } : {}),
      ...(parsed.description !== undefined
        ? { description: parsed.description }
        : {}),
      ...(parsed.slug !== undefined ? { slug: parsed.slug } : {}),
    },
  })
}

export async function deletePlaylist(
  context: ActiveOrganizationContext,
  playlistId: string,
) {
  await requireDjStudioPermission(
    context,
    DJ_STUDIO_PERMISSION_KEYS.PLAYLISTS_MANAGE,
  )

  const existing = await prisma.playlist.findFirst({
    where: { id: playlistId, organizationId: context.organizationId },
    select: { id: true },
  })

  if (!existing) {
    throw new DjStudioError(DJ_STUDIO_ERROR_CODES.PLAYLIST_NOT_FOUND)
  }

  await prisma.playlist.delete({ where: { id: playlistId } })
}

export async function addPlaylistItem(
  context: ActiveOrganizationContext,
  playlistId: string,
  input: z.infer<typeof addPlaylistItemSchema>,
) {
  await requireDjStudioPermission(
    context,
    DJ_STUDIO_PERMISSION_KEYS.PLAYLISTS_MANAGE,
  )

  const parsed = addPlaylistItemSchema.parse(input)

  const playlist = await prisma.playlist.findFirst({
    where: { id: playlistId, organizationId: context.organizationId },
    select: { id: true },
  })

  if (!playlist) {
    throw new DjStudioError(DJ_STUDIO_ERROR_CODES.PLAYLIST_NOT_FOUND)
  }

  const libraryItem = await prisma.libraryItem.findFirst({
    where: {
      id: parsed.libraryItemId,
      organizationId: context.organizationId,
    },
    select: { id: true },
  })

  if (!libraryItem) {
    throw new DjStudioError(DJ_STUDIO_ERROR_CODES.LIBRARY_ITEM_NOT_FOUND)
  }

  return prisma.$transaction(async (client) => {
    let position = parsed.position

    if (position === undefined) {
      const max = await client.playlistItem.aggregate({
        where: { playlistId },
        _max: { position: true },
      })
      position = (max._max.position ?? -1) + 1
    }

    return client.playlistItem.create({
      data: {
        organizationId: context.organizationId,
        playlistId,
        libraryItemId: parsed.libraryItemId,
        position,
        addedByProfileId: context.profileId,
        notes: parsed.notes ?? null,
        transitionNotes: parsed.transitionNotes ?? null,
        sourceTimestampMs: parsed.sourceTimestampMs ?? null,
      },
    })
  })
}

export async function updatePlaylistItem(
  context: ActiveOrganizationContext,
  playlistItemId: string,
  input: {
    notes?: string | null
    transitionNotes?: string | null
    sourceTimestampMs?: number | null
  },
) {
  await requireDjStudioPermission(
    context,
    DJ_STUDIO_PERMISSION_KEYS.PLAYLISTS_MANAGE,
  )

  const existing = await prisma.playlistItem.findFirst({
    where: {
      id: playlistItemId,
      organizationId: context.organizationId,
    },
    select: { id: true },
  })

  if (!existing) {
    throw new DjStudioError(DJ_STUDIO_ERROR_CODES.PLAYLIST_ITEM_NOT_FOUND)
  }

  return prisma.playlistItem.update({
    where: { id: playlistItemId },
    data: {
      ...(input.notes !== undefined ? { notes: input.notes } : {}),
      ...(input.transitionNotes !== undefined
        ? { transitionNotes: input.transitionNotes }
        : {}),
      ...(input.sourceTimestampMs !== undefined
        ? { sourceTimestampMs: input.sourceTimestampMs }
        : {}),
    },
  })
}

export async function removePlaylistItem(
  context: ActiveOrganizationContext,
  playlistItemId: string,
) {
  await requireDjStudioPermission(
    context,
    DJ_STUDIO_PERMISSION_KEYS.PLAYLISTS_MANAGE,
  )

  const existing = await prisma.playlistItem.findFirst({
    where: {
      id: playlistItemId,
      organizationId: context.organizationId,
    },
    select: { id: true },
  })

  if (!existing) {
    throw new DjStudioError(DJ_STUDIO_ERROR_CODES.PLAYLIST_ITEM_NOT_FOUND)
  }

  await prisma.playlistItem.delete({ where: { id: playlistItemId } })
}

/**
 * Reorder playlist items transactionally.
 * Phase 1: move to temporary negative positions to avoid unique collisions.
 * Phase 2: assign final 0..n-1 positions.
 */
export async function reorderPlaylistItems(
  context: ActiveOrganizationContext,
  playlistId: string,
  orderedPlaylistItemIds: string[],
) {
  await requireDjStudioPermission(
    context,
    DJ_STUDIO_PERMISSION_KEYS.PLAYLISTS_MANAGE,
  )

  const playlist = await prisma.playlist.findFirst({
    where: { id: playlistId, organizationId: context.organizationId },
    select: { id: true },
  })

  if (!playlist) {
    throw new DjStudioError(DJ_STUDIO_ERROR_CODES.PLAYLIST_NOT_FOUND)
  }

  const existingItems = await prisma.playlistItem.findMany({
    where: { playlistId, organizationId: context.organizationId },
    select: { id: true },
  })
  const existingIds = new Set(existingItems.map((item) => item.id))

  if (
    orderedPlaylistItemIds.length !== existingIds.size ||
    orderedPlaylistItemIds.some((id) => !existingIds.has(id))
  ) {
    throw new DjStudioError(DJ_STUDIO_ERROR_CODES.VALIDATION_ERROR)
  }

  await prisma.$transaction(async (client) => {
    for (let index = 0; index < orderedPlaylistItemIds.length; index += 1) {
      await client.playlistItem.update({
        where: { id: orderedPlaylistItemIds[index]! },
        data: { position: -(index + 1) },
      })
    }

    for (let index = 0; index < orderedPlaylistItemIds.length; index += 1) {
      await client.playlistItem.update({
        where: { id: orderedPlaylistItemIds[index]! },
        data: { position: index },
      })
    }
  })

  return prisma.playlistItem.findMany({
    where: { playlistId },
    orderBy: { position: 'asc' },
  })
}
