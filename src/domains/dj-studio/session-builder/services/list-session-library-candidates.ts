import 'server-only'

import { prisma } from '@/lib/prisma'
import { DJ_STUDIO_PERMISSION_KEYS } from '@/domains/dj-studio/permissions/permission-keys'
import { requireDjStudioPermission } from '@/domains/dj-studio/permissions/require-dj-studio-permission'
import type { ActiveOrganizationContext } from '@/domains/dj-studio/organization/types'
import {
  effectiveBpm,
  effectiveCamelotKey,
} from '@/domains/dj-studio/session-builder/musical-rules'
import { isSessionBuilderVisibleTag } from '@/domains/dj-studio/session-builder/tags/is-session-builder-visible-tag'
import type { SessionCandidateSource } from '@/domains/dj-studio/session-builder/types'

function decimalToNumber(value: unknown): number | null {
  if (value === null || value === undefined) {
    return null
  }
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : null
  }
  if (
    typeof value === 'object' &&
    value !== null &&
    'toNumber' in value &&
    typeof (value as { toNumber: () => number }).toNumber === 'function'
  ) {
    const converted = (value as { toNumber: () => number }).toNumber()
    return Number.isFinite(converted) ? converted : null
  }
  const converted = Number(value)
  return Number.isFinite(converted) ? converted : null
}

/**
 * Load Organization LIBRARY rows as session-builder source candidates.
 * Read-only. Selection authority remains libraryItemId.
 */
export async function listSessionLibraryCandidateSources(
  context: ActiveOrganizationContext,
): Promise<SessionCandidateSource[]> {
  await requireDjStudioPermission(
    context,
    DJ_STUDIO_PERMISSION_KEYS.LIBRARY_READ,
  )

  const items = await prisma.libraryItem.findMany({
    where: {
      organizationId: context.organizationId,
      status: 'LIBRARY',
    },
    select: {
      id: true,
      trackId: true,
      customBpm: true,
      customKey: true,
      energy: true,
      rating: true,
      familiarity: true,
      isFavorite: true,
      track: {
        select: {
          id: true,
          title: true,
          bpm: true,
          camelotKey: true,
          durationMs: true,
          artists: {
            orderBy: { position: 'asc' },
            select: {
              creditedName: true,
              artist: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
        },
      },
      tags: {
        select: {
          tag: {
            select: {
              id: true,
              name: true,
              normalizedName: true,
            },
          },
        },
      },
    },
  })

  return items.map((item) => {
    const artists = item.track.artists.map((credit) => ({
      id: credit.artist.id,
      name: credit.creditedName?.trim() || credit.artist.name,
    }))

    return {
      libraryItemId: item.id,
      trackId: item.trackId,
      title: item.track.title,
      artists,
      effectiveBpm: effectiveBpm({
        customBpm: decimalToNumber(item.customBpm),
        trackBpm: decimalToNumber(item.track.bpm),
      }),
      effectiveCamelotKey: effectiveCamelotKey({
        customKey: item.customKey,
        camelotKey: item.track.camelotKey,
      }),
      durationMs: item.track.durationMs,
      energy: item.energy,
      rating: item.rating,
      familiarity: item.familiarity,
      isFavorite: item.isFavorite,
      tags: item.tags
        .map((join) => ({
          id: join.tag.id,
          name: join.tag.name,
          normalizedName: join.tag.normalizedName,
        }))
        .filter((tag) => isSessionBuilderVisibleTag(tag)),
    }
  })
}
