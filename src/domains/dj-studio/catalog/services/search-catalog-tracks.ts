import 'server-only'

import { z } from 'zod'

import { getCurrentProfile } from '@/core/identity/profile/services/get-current-profile'
import { prisma } from '@/lib/prisma'
import {
  DJ_STUDIO_ERROR_CODES,
  DjStudioError,
} from '@/domains/dj-studio/shared/errors'

const searchSchema = z.object({
  query: z.string().trim().min(1).max(200),
  limit: z.number().int().min(1).max(50).optional(),
})

const trackSelect = {
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
} as const

/**
 * Minimal authenticated catalog search for Product "Add Track".
 * Read-only. Does not create Tracks.
 */
export async function searchCatalogTracks(input: {
  query: string
  limit?: number
}) {
  const session = await getCurrentProfile()

  if (!session?.profile?.id) {
    throw new DjStudioError(DJ_STUDIO_ERROR_CODES.UNAUTHENTICATED)
  }

  const parsed = searchSchema.parse(input)
  const limit = parsed.limit ?? 20

  return prisma.track.findMany({
    where: {
      OR: [
        { title: { contains: parsed.query, mode: 'insensitive' } },
        {
          artists: {
            some: {
              artist: {
                name: { contains: parsed.query, mode: 'insensitive' },
              },
            },
          },
        },
      ],
    },
    take: limit,
    orderBy: { title: 'asc' },
    select: trackSelect,
  })
}
