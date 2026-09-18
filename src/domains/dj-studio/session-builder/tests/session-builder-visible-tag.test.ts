import { describe, expect, it } from 'vitest'

import { toPlaylistGenerationCandidate } from '@/domains/dj-studio/session-builder/provider/map-session-candidate'
import { isSessionBuilderVisibleTag } from '@/domains/dj-studio/session-builder/tags/is-session-builder-visible-tag'
import type { SessionCandidate } from '@/domains/dj-studio/session-builder/types'

describe('isSessionBuilderVisibleTag', () => {
  it('excludes import:* markers', () => {
    expect(
      isSessionBuilderVisibleTag({
        name: 'import:latin-afrohouse-pilot-001',
        normalizedName: 'import:latin-afrohouse-pilot-001',
      }),
    ).toBe(false)
  })

  it('excludes import-created:* markers', () => {
    expect(
      isSessionBuilderVisibleTag({
        name: 'import-created:latin-afrohouse-pilot-001',
        normalizedName: 'import-created:latin-afrohouse-pilot-001',
      }),
    ).toBe(false)
  })

  it('preserves Afro House and Latin House', () => {
    expect(
      isSessionBuilderVisibleTag({
        name: 'Afro House',
        normalizedName: 'afro house',
      }),
    ).toBe(true)
    expect(
      isSessionBuilderVisibleTag({
        name: 'Latin House',
        normalizedName: 'latin house',
      }),
    ).toBe(true)
  })

  it('preserves arbitrary user tags that contain the word import elsewhere', () => {
    expect(
      isSessionBuilderVisibleTag({
        name: 'My favorite import vinyl',
        normalizedName: 'my favorite import vinyl',
      }),
    ).toBe(true)
    expect(
      isSessionBuilderVisibleTag({
        name: 'important peak track',
        normalizedName: 'important peak track',
      }),
    ).toBe(true)
  })

  it('excludes when only normalizedName carries the technical prefix', () => {
    expect(
      isSessionBuilderVisibleTag({
        name: 'Import Batch Marker',
        normalizedName: 'import:hidden-batch',
      }),
    ).toBe(false)
  })
})

describe('provider candidate tag visibility', () => {
  it('receives only provider-visible musical/user tags after source filtering', () => {
    const sourceTags = [
      {
        id: '11111111-1111-4111-8111-111111111111',
        name: 'import:latin-afrohouse-pilot-001',
        normalizedName: 'import:latin-afrohouse-pilot-001',
      },
      {
        id: '22222222-2222-4222-8222-222222222222',
        name: 'import-created:latin-afrohouse-pilot-001',
        normalizedName: 'import-created:latin-afrohouse-pilot-001',
      },
      {
        id: '33333333-3333-4333-8333-333333333333',
        name: 'Afro House',
        normalizedName: 'afro house',
      },
      {
        id: '44444444-4444-4444-8444-444444444444',
        name: 'Latin House',
        normalizedName: 'latin house',
      },
      {
        id: '55555555-5555-4555-8555-555555555555',
        name: 'Sunset',
        normalizedName: 'sunset',
      },
    ].filter((tag) => isSessionBuilderVisibleTag(tag))

    const candidate: SessionCandidate = {
      libraryItemId: '66666666-6666-4666-8666-666666666666',
      trackId: '77777777-7777-4777-8777-777777777777',
      title: 'Xica Da Silva',
      artists: [
        { id: '88888888-8888-4888-8888-888888888888', name: 'Aroop ROY' },
      ],
      effectiveBpm: 127,
      effectiveCamelotKey: '3A',
      durationMs: 450_000,
      energy: 7,
      rating: null,
      familiarity: null,
      isFavorite: false,
      tags: sourceTags,
      score: 50,
      scoreBreakdown: {
        bpm: 20,
        rating: 0,
        familiarity: 0,
        favorite: 0,
        tags: 15,
        energy: 10,
        camelot: 5,
      },
    }

    const mapped = toPlaylistGenerationCandidate(candidate)
    expect(mapped.tags).toEqual(['Afro House', 'Latin House', 'Sunset'])
    expect(mapped.tags.some((tag) => tag.startsWith('import:'))).toBe(false)
    expect(mapped.tags.some((tag) => tag.startsWith('import-created:'))).toBe(
      false,
    )
  })
})
