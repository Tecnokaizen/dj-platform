import 'server-only'

import type { Prisma } from '@/generated/prisma/client'
import { prisma } from '@/lib/prisma'
import type { ActiveOrganizationContext } from '@/domains/dj-studio/organization/types'
import { DJ_STUDIO_PERMISSION_KEYS } from '@/domains/dj-studio/permissions/permission-keys'
import { requireDjStudioPermission } from '@/domains/dj-studio/permissions/require-dj-studio-permission'
import { parseSessionBuilderSaveInput } from '@/domains/dj-studio/session-builder/services/save-session-builder-playlist-input'
import {
  DJ_STUDIO_ERROR_CODES,
  DjStudioError,
} from '@/domains/dj-studio/shared/errors'

export const SESSION_BUILDER_GENERATION_VERSION = 'dj-studio-002-v1'
export const SESSION_BUILDER_GENERATED_BY = 'dj-studio-session-builder'

export type SaveSessionBuilderPlaylistResult = {
  playlistId: string
}

export type SaveSessionBuilderPlaylistOptions = {
  now?: () => Date
}

/**
 * Persist an ephemeral Session Builder proposal as AI_GENERATED Playlist.
 * Re-requires playlists.manage; revalidates LibraryItem org + LIBRARY;
 * atomic create of playlist + items. No Provider / Candidate Engine calls.
 */
export async function saveSessionBuilderDraftAsPlaylist(
  context: ActiveOrganizationContext,
  input: unknown,
  options: SaveSessionBuilderPlaylistOptions = {},
): Promise<SaveSessionBuilderPlaylistResult> {
  await requireDjStudioPermission(
    context,
    DJ_STUDIO_PERMISSION_KEYS.PLAYLISTS_MANAGE,
  )

  const parsed = parseSessionBuilderSaveInput(input)
  const now = options.now ?? (() => new Date())
  const generatedAt = now().toISOString()
  const uniqueIds = [...new Set(parsed.tracks.map((track) => track.libraryItemId))]

  return prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    const rows = await tx.libraryItem.findMany({
      where: {
        organizationId: context.organizationId,
        status: 'LIBRARY',
        id: { in: uniqueIds },
      },
      select: { id: true },
    })

    if (rows.length !== uniqueIds.length) {
      throw new DjStudioError(
        DJ_STUDIO_ERROR_CODES.SESSION_BUILDER_STALE_DRAFT,
        'One or more proposal tracks are no longer valid LIBRARY items',
      )
    }

    const playlist = await tx.playlist.create({
      data: {
        organizationId: context.organizationId,
        name: parsed.name,
        slug: null,
        description: null,
        playlistType: 'AI_GENERATED',
        visibility: 'PRIVATE',
        metadata: {
          generatedBy: SESSION_BUILDER_GENERATED_BY,
          prompt: parsed.prompt,
          generatedAt,
          generationVersion: SESSION_BUILDER_GENERATION_VERSION,
        },
      },
      select: { id: true },
    })

    await tx.playlistItem.createMany({
      data: parsed.tracks.map((track, position) => ({
        organizationId: context.organizationId,
        playlistId: playlist.id,
        libraryItemId: track.libraryItemId,
        position,
        addedByProfileId: context.profileId,
        notes: null,
        transitionNotes: track.transitionNote,
        sourceTimestampMs: null,
      })),
    })

    return { playlistId: playlist.id }
  })
}
