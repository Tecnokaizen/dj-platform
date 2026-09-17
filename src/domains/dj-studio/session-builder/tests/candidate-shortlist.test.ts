import { describe, expect, it } from 'vitest'

import { buildSessionCandidateShortlistFromSources } from '@/domains/dj-studio/session-builder/candidate-engine/build-shortlist'
import {
  SESSION_CANDIDATE_SHORTLIST_MAX,
} from '@/domains/dj-studio/session-builder/candidate-engine/constants'
import {
  DJ_STUDIO_ERROR_CODES,
  DjStudioError,
} from '@/domains/dj-studio/shared/errors'
import type {
  CandidateSelectionInput,
  SessionCandidateSource,
} from '@/domains/dj-studio/session-builder/types'

const input: CandidateSelectionInput = {
  prompt: 'sunset groove',
  energyCurve: 'steady',
}

function source(
  id: string,
  overrides: Partial<SessionCandidateSource> = {},
): SessionCandidateSource {
  return {
    libraryItemId: id,
    trackId: `track-${id}`,
    title: `Title ${id}`,
    artists: overrides.artists ?? [{ id: `artist-${id}`, name: `Artist ${id}` }],
    effectiveBpm: 120,
    effectiveCamelotKey: '8A',
    durationMs: 180_000,
    energy: 3,
    rating: 3,
    familiarity: 3,
    isFavorite: false,
    tags: [],
    ...overrides,
  }
}

function makeN(count: number): SessionCandidateSource[] {
  return Array.from({ length: count }, (_, index) => {
    const id = `item-${String(index).padStart(3, '0')}`
    return source(id, { rating: index })
  })
}

describe('buildSessionCandidateShortlistFromSources', () => {
  it('fails when eligible candidates are fewer than 8', () => {
    expect(() =>
      buildSessionCandidateShortlistFromSources(makeN(7), input),
    ).toThrow(DjStudioError)

    try {
      buildSessionCandidateShortlistFromSources(makeN(7), input)
    } catch (error) {
      expect(error).toBeInstanceOf(DjStudioError)
      expect((error as DjStudioError).code).toBe(
        DJ_STUDIO_ERROR_CODES.INSUFFICIENT_SESSION_CANDIDATES,
      )
      expect((error as DjStudioError).details).toEqual({ availableCount: 7 })
    }
  })

  it('returns all eligible when 8, 20, or 60', () => {
    expect(
      buildSessionCandidateShortlistFromSources(makeN(8), input),
    ).toHaveLength(8)
    expect(
      buildSessionCandidateShortlistFromSources(makeN(20), input),
    ).toHaveLength(20)
    expect(
      buildSessionCandidateShortlistFromSources(makeN(60), input),
    ).toHaveLength(60)
  })

  it('caps at 60 when more than 60 eligible', () => {
    const shortlist = buildSessionCandidateShortlistFromSources(
      makeN(100),
      input,
    )
    expect(shortlist).toHaveLength(SESSION_CANDIDATE_SHORTLIST_MAX)
  })

  it('is stable across repeated runs', () => {
    const sources = makeN(25)
    const first = buildSessionCandidateShortlistFromSources(sources, input).map(
      (candidate) => candidate.libraryItemId,
    )
    const second = buildSessionCandidateShortlistFromSources(
      sources,
      input,
    ).map((candidate) => candidate.libraryItemId)
    expect(second).toEqual(first)
  })

  it('applies artist diversity cap then backfills when needed', () => {
    const dominantArtist = 'artist-dominant'
    const sources: SessionCandidateSource[] = []

    for (let index = 0; index < 70; index += 1) {
      sources.push(
        source(`dom-${String(index).padStart(3, '0')}`, {
          artists: [{ id: dominantArtist, name: 'Dominant' }],
          rating: 200 - index,
          isFavorite: true,
        }),
      )
    }

    for (let index = 0; index < 50; index += 1) {
      sources.push(
        source(`alt-${String(index).padStart(3, '0')}`, {
          artists: [{ id: `alt-${index}`, name: `Alt ${index}` }],
          rating: 50 - index,
        }),
      )
    }

    const shortlist = buildSessionCandidateShortlistFromSources(sources, input)
    expect(shortlist).toHaveLength(SESSION_CANDIDATE_SHORTLIST_MAX)

    const dominantCount = shortlist.filter((candidate) =>
      candidate.artists.some((artist) => artist.id === dominantArtist),
    ).length
    const altCount = shortlist.length - dominantCount

    // First pass: 4 dominant + 50 alts = 54; backfill 6 dominant → 10.
    expect(altCount).toBe(50)
    expect(dominantCount).toBe(10)

    const onlyDominant = Array.from({ length: 10 }, (_, index) =>
      source(`only-${index}`, {
        artists: [{ id: dominantArtist, name: 'Dominant' }],
        rating: index,
      }),
    )
    const backfilled = buildSessionCandidateShortlistFromSources(
      onlyDominant,
      input,
    )
    expect(backfilled).toHaveLength(10)
    expect(
      backfilled.filter((candidate) =>
        candidate.artists.some((artist) => artist.id === dominantArtist),
      ),
    ).toHaveLength(10)
  })
})
