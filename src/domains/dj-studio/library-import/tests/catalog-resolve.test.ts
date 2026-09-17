import { describe, expect, it } from 'vitest'

import {
  durationWithinTolerance,
  resolveArtist,
  resolveCatalogTrack,
  type LibraryImportCatalogPort,
} from '@/domains/dj-studio/library-import/catalog-resolve'
import { TRACK_DURATION_TOLERANCE_MS } from '@/domains/dj-studio/library-import/constants'
import type {
  CatalogArtistCandidate,
  CatalogTrackCandidate,
} from '@/domains/dj-studio/library-import/types'

function track(
  partial: Partial<CatalogTrackCandidate> & Pick<CatalogTrackCandidate, 'id'>,
): CatalogTrackCandidate {
  return {
    title: 'Track',
    normalizedTitle: 'track',
    durationMs: 360000,
    bpm: 120,
    musicalKey: null,
    camelotKey: '8A',
    isrc: null,
    releaseDate: null,
    metadata: {},
    primaryArtistNormalizedName: 'artist',
    ...partial,
  }
}

function createCatalog(seed: {
  byIsrc?: Record<string, CatalogTrackCandidate[]>
  byTitle?: Record<string, CatalogTrackCandidate[]>
  artists?: Record<string, CatalogArtistCandidate[]>
}): LibraryImportCatalogPort {
  return {
    findTracksByIsrc: async (isrc) => seed.byIsrc?.[isrc] ?? [],
    findTracksByNormalizedTitle: async (title) => seed.byTitle?.[title] ?? [],
    findArtistsByNormalizedName: async (name) => seed.artists?.[name] ?? [],
    findLibraryItem: async () => null,
    findTagsByNormalizedNames: async () => [],
  }
}

describe('catalog resolve / dedupe', () => {
  it('documents TRACK_DURATION_TOLERANCE_MS = 2000', () => {
    expect(TRACK_DURATION_TOLERANCE_MS).toBe(2000)
    expect(durationWithinTolerance(360000, 361500)).toBe(true)
    expect(durationWithinTolerance(360000, 362001)).toBe(false)
  })

  it('reuses unique ISRC match', async () => {
    const catalog = createCatalog({
      byIsrc: { USRC1: [track({ id: 't1', isrc: 'USRC1' })] },
    })
    const result = await resolveCatalogTrack(catalog, {
      isrc: 'USRC1',
      normalizedTitle: 'other',
      normalizedArtist: 'other',
      durationMs: null,
    })
    expect(result).toMatchObject({ status: 'reuse', method: 'isrc', track: { id: 't1' } })
  })

  it('rejects ambiguous ISRC (>1)', async () => {
    const catalog = createCatalog({
      byIsrc: {
        USRC1: [track({ id: 't1', isrc: 'USRC1' }), track({ id: 't2', isrc: 'USRC1' })],
      },
    })
    const result = await resolveCatalogTrack(catalog, {
      isrc: 'USRC1',
      normalizedTitle: 'track',
      normalizedArtist: 'artist',
      durationMs: 360000,
    })
    expect(result).toMatchObject({ status: 'ambiguous', code: 'AMBIGUOUS_ISRC' })
  })

  it('reuses title+artist+duration within tolerance', async () => {
    const catalog = createCatalog({
      byTitle: {
        track: [track({ id: 't1', durationMs: 360000 })],
      },
    })
    const result = await resolveCatalogTrack(catalog, {
      isrc: null,
      normalizedTitle: 'track',
      normalizedArtist: 'artist',
      durationMs: 361000,
    })
    expect(result).toMatchObject({
      status: 'reuse',
      method: 'title_artist_duration',
    })
  })

  it('creates when duration outside tolerance', async () => {
    const catalog = createCatalog({
      byTitle: {
        track: [track({ id: 't1', durationMs: 360000 })],
      },
    })
    const result = await resolveCatalogTrack(catalog, {
      isrc: null,
      normalizedTitle: 'track',
      normalizedArtist: 'artist',
      durationMs: 400000,
    })
    expect(result).toMatchObject({ status: 'create' })
  })

  it('reuses no-duration when exactly one title+artist match', async () => {
    const catalog = createCatalog({
      byTitle: {
        track: [track({ id: 't1', durationMs: null })],
      },
    })
    const result = await resolveCatalogTrack(catalog, {
      isrc: null,
      normalizedTitle: 'track',
      normalizedArtist: 'artist',
      durationMs: null,
    })
    expect(result).toMatchObject({ status: 'reuse', method: 'title_artist' })
  })

  it('rejects no-duration when multiple title+artist matches', async () => {
    const catalog = createCatalog({
      byTitle: {
        track: [
          track({ id: 't1', durationMs: 360000 }),
          track({ id: 't2', durationMs: 370000 }),
        ],
      },
    })
    const result = await resolveCatalogTrack(catalog, {
      isrc: null,
      normalizedTitle: 'track',
      normalizedArtist: 'artist',
      durationMs: null,
    })
    expect(result).toMatchObject({
      status: 'ambiguous',
      code: 'AMBIGUOUS_TITLE_ARTIST',
    })
  })

  it('keeps same title different artist distinct', async () => {
    const catalog = createCatalog({
      byTitle: {
        track: [track({ id: 't1', primaryArtistNormalizedName: 'artist a' })],
      },
    })
    const result = await resolveCatalogTrack(catalog, {
      isrc: null,
      normalizedTitle: 'track',
      normalizedArtist: 'artist b',
      durationMs: 360000,
    })
    expect(result).toMatchObject({ status: 'create' })
  })

  it('rejects ambiguous artists', async () => {
    const catalog = createCatalog({
      artists: {
        artist: [
          { id: 'a1', name: 'Artist', normalizedName: 'artist', slug: 'artist' },
          { id: 'a2', name: 'Artist', normalizedName: 'artist', slug: 'artist-2' },
        ],
      },
    })
    const result = await resolveArtist(catalog, 'artist')
    expect(result.status).toBe('ambiguous')
  })
})
