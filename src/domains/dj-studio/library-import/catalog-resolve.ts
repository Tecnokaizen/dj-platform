import 'server-only'

import { Prisma } from '@/generated/prisma/client'
import type { PrismaClient } from '@/generated/prisma/client'
import { TRACK_DURATION_TOLERANCE_MS } from '@/domains/dj-studio/library-import/constants'
import type {
  CatalogArtistCandidate,
  CatalogLibraryItemCandidate,
  CatalogTagCandidate,
  CatalogTrackCandidate,
} from '@/domains/dj-studio/library-import/types'
import { ArtistRole } from '@/generated/prisma/client'

export type LibraryImportCatalogPort = {
  findTracksByIsrc(isrc: string): Promise<CatalogTrackCandidate[]>
  findTracksByNormalizedTitle(
    normalizedTitle: string,
  ): Promise<CatalogTrackCandidate[]>
  findArtistsByNormalizedName(
    normalizedName: string,
  ): Promise<CatalogArtistCandidate[]>
  findLibraryItem(
    organizationId: string,
    trackId: string,
  ): Promise<CatalogLibraryItemCandidate | null>
  findTagsByNormalizedNames(
    organizationId: string,
    normalizedNames: string[],
  ): Promise<CatalogTagCandidate[]>
}

function toTrackCandidate(
  track: {
    id: string
    title: string
    normalizedTitle: string
    durationMs: number | null
    bpm: unknown
    musicalKey: string | null
    camelotKey: string | null
    isrc: string | null
    releaseDate: Date | null
    metadata: unknown
    artists: Array<{
      role: string
      position: number
      artist: { normalizedName: string }
    }>
  },
): CatalogTrackCandidate {
  const primary = track.artists
    .filter((entry) => entry.role === ArtistRole.PRIMARY)
    .sort((a, b) => a.position - b.position)[0]

  return {
    id: track.id,
    title: track.title,
    normalizedTitle: track.normalizedTitle,
    durationMs: track.durationMs,
    bpm: track.bpm,
    musicalKey: track.musicalKey,
    camelotKey: track.camelotKey,
    isrc: track.isrc,
    releaseDate: track.releaseDate,
    metadata: track.metadata,
    primaryArtistNormalizedName: primary?.artist.normalizedName ?? null,
  }
}

const trackSelect = {
  id: true,
  title: true,
  normalizedTitle: true,
  durationMs: true,
  bpm: true,
  musicalKey: true,
  camelotKey: true,
  isrc: true,
  releaseDate: true,
  metadata: true,
  artists: {
    select: {
      role: true,
      position: true,
      artist: { select: { normalizedName: true } },
    },
  },
} as const

export function createPrismaLibraryImportCatalog(
  client: PrismaClient | Prisma.TransactionClient,
): LibraryImportCatalogPort {
  return {
    async findTracksByIsrc(isrc) {
      const tracks = await client.track.findMany({
        where: { isrc },
        select: trackSelect,
      })
      return tracks.map(toTrackCandidate)
    },

    async findTracksByNormalizedTitle(normalizedTitle) {
      const tracks = await client.track.findMany({
        where: { normalizedTitle },
        select: trackSelect,
      })
      return tracks.map(toTrackCandidate)
    },

    async findArtistsByNormalizedName(normalizedName) {
      return client.artist.findMany({
        where: { normalizedName },
        select: {
          id: true,
          name: true,
          normalizedName: true,
          slug: true,
        },
      })
    },

    async findLibraryItem(organizationId, trackId) {
      const item = await client.libraryItem.findUnique({
        where: {
          organizationId_trackId: { organizationId, trackId },
        },
        select: {
          id: true,
          trackId: true,
          energy: true,
          notes: true,
          rating: true,
          familiarity: true,
          isFavorite: true,
          playCount: true,
          lastPlayedAt: true,
          tags: {
            select: {
              tag: { select: { normalizedName: true } },
            },
          },
        },
      })

      if (!item) {
        return null
      }

      return {
        id: item.id,
        trackId: item.trackId,
        energy: item.energy,
        notes: item.notes,
        rating: item.rating,
        familiarity: item.familiarity,
        isFavorite: item.isFavorite,
        playCount: item.playCount,
        lastPlayedAt: item.lastPlayedAt,
        tagNormalizedNames: item.tags.map((entry) => entry.tag.normalizedName),
      }
    },

    async findTagsByNormalizedNames(organizationId, normalizedNames) {
      if (normalizedNames.length === 0) {
        return []
      }
      return client.tag.findMany({
        where: {
          organizationId,
          normalizedName: { in: normalizedNames },
        },
        select: {
          id: true,
          name: true,
          normalizedName: true,
        },
      })
    },
  }
}

export function decimalToNumber(value: unknown): number | null {
  if (value === null || value === undefined) {
    return null
  }
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : null
  }
  if (typeof value === 'string') {
    const n = Number(value)
    return Number.isFinite(n) ? n : null
  }
  if (value instanceof Prisma.Decimal) {
    return value.toNumber()
  }
  if (
    typeof value === 'object' &&
    value !== null &&
    'toNumber' in value &&
    typeof (value as { toNumber: () => number }).toNumber === 'function'
  ) {
    return (value as { toNumber: () => number }).toNumber()
  }
  return null
}

export function durationWithinTolerance(
  existing: number | null,
  candidate: number | null,
  toleranceMs: number = TRACK_DURATION_TOLERANCE_MS,
): boolean {
  if (existing === null || candidate === null) {
    return false
  }
  return Math.abs(existing - candidate) <= toleranceMs
}

export type CatalogResolveResult =
  | { status: 'create' }
  | { status: 'reuse'; track: CatalogTrackCandidate; method: 'isrc' | 'title_artist_duration' | 'title_artist' }
  | { status: 'ambiguous'; code: 'AMBIGUOUS_ISRC' | 'AMBIGUOUS_TITLE_ARTIST'; message: string }

/**
 * Conservative catalog match:
 * 1. ISRC (0 continue, 1 reuse, >1 ambiguous)
 * 2. title + primary artist (+ duration when present)
 */
export async function resolveCatalogTrack(
  catalog: LibraryImportCatalogPort,
  input: {
    isrc: string | null
    normalizedTitle: string
    normalizedArtist: string
    durationMs: number | null
  },
): Promise<CatalogResolveResult> {
  if (input.isrc) {
    const byIsrc = await catalog.findTracksByIsrc(input.isrc)
    if (byIsrc.length === 1) {
      return { status: 'reuse', track: byIsrc[0]!, method: 'isrc' }
    }
    if (byIsrc.length > 1) {
      return {
        status: 'ambiguous',
        code: 'AMBIGUOUS_ISRC',
        message: `Multiple Tracks share ISRC ${input.isrc}`,
      }
    }
  }

  const byTitle = await catalog.findTracksByNormalizedTitle(input.normalizedTitle)
  const artistMatches = byTitle.filter(
    (track) => track.primaryArtistNormalizedName === input.normalizedArtist,
  )

  if (input.durationMs !== null) {
    const within = artistMatches.filter((track) =>
      durationWithinTolerance(track.durationMs, input.durationMs),
    )
    if (within.length === 1) {
      return {
        status: 'reuse',
        track: within[0]!,
        method: 'title_artist_duration',
      }
    }
    if (within.length > 1) {
      return {
        status: 'ambiguous',
        code: 'AMBIGUOUS_TITLE_ARTIST',
        message: 'Multiple Tracks match title+artist within duration tolerance',
      }
    }
    // No match within tolerance → create (different version)
    return { status: 'create' }
  }

  if (artistMatches.length === 1) {
    return { status: 'reuse', track: artistMatches[0]!, method: 'title_artist' }
  }
  if (artistMatches.length > 1) {
    return {
      status: 'ambiguous',
      code: 'AMBIGUOUS_TITLE_ARTIST',
      message:
        'Multiple Tracks match title+artist without duration; refusing to guess',
    }
  }

  return { status: 'create' }
}

export async function resolveArtist(
  catalog: LibraryImportCatalogPort,
  normalizedArtist: string,
): Promise<
  | { status: 'reuse'; artist: CatalogArtistCandidate }
  | { status: 'create' }
  | { status: 'ambiguous'; message: string }
> {
  const artists = await catalog.findArtistsByNormalizedName(normalizedArtist)
  if (artists.length === 0) {
    return { status: 'create' }
  }
  if (artists.length === 1) {
    return { status: 'reuse', artist: artists[0]! }
  }
  return {
    status: 'ambiguous',
    message: `Multiple Artists share normalizedName "${normalizedArtist}"`,
  }
}
