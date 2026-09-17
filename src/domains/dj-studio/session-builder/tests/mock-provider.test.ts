import { describe, expect, it } from 'vitest'

import {
  PLAYLIST_GENERATION_PROVIDER_ERROR_CODES,
  PlaylistGenerationProviderError,
  parsePlaylistGenerationProviderOutput,
  toPlaylistGenerationCandidate,
} from '@/domains/dj-studio/session-builder/provider'
import type { SessionCandidate } from '@/domains/dj-studio/session-builder/types'
import {
  MockPlaylistGenerationProvider,
  createMockCandidate,
} from '@/lib/ai/providers/mock-playlist-generation-provider'

function request(overrides: {
  candidates?: ReturnType<typeof createMockCandidate>[]
  trackCountHint?: number
  prompt?: string
} = {}) {
  const candidates =
    overrides.candidates ??
    Array.from({ length: 15 }, (_, index) =>
      createMockCandidate({
        libraryItemId: `aaaaaaaa-aaaa-4aaa-8aaa-${String(index).padStart(12, '0')}`,
        title: `Track ${index}`,
        candidateScore: 100 - index,
      }),
    )

  return {
    prompt: overrides.prompt ?? 'sunset afro house',
    targetDurationMin: 90,
    energyCurve: 'gradual_rise' as const,
    trackCountHint: overrides.trackCountHint,
    bpm: { start: 118, end: 123 },
    candidates,
  }
}

describe('MockPlaylistGenerationProvider', () => {
  it('is deterministic and preserves candidate order', async () => {
    const provider = new MockPlaylistGenerationProvider({ mode: 'success' })
    const input = request({ trackCountHint: 5 })
    const first = await provider.generate(input)
    const second = await provider.generate(input)

    expect(first).toEqual(second)

    const allowed = new Set(input.candidates.map((c) => c.libraryItemId))
    const parsed = parsePlaylistGenerationProviderOutput(first, allowed)

    expect(parsed.tracks).toHaveLength(5)
    expect(parsed.tracks.map((track) => track.libraryItemId)).toEqual(
      input.candidates.slice(0, 5).map((candidate) => candidate.libraryItemId),
    )
    expect(parsed.tracks.map((track) => track.position)).toEqual([0, 1, 2, 3, 4])
    expect(parsed.title).toBe('Propuesta de sesión')
  })

  it('caps selection to candidate count and defaults without hint', async () => {
    const few = request({
      candidates: Array.from({ length: 3 }, (_, index) =>
        createMockCandidate({
          libraryItemId: `bbbbbbbb-bbbb-4bbb-8bbb-${String(index).padStart(12, '0')}`,
        }),
      ),
      trackCountHint: 12,
    })
    const provider = new MockPlaylistGenerationProvider()
    const capped = parsePlaylistGenerationProviderOutput(
      await provider.generate(few),
      few.candidates.map((candidate) => candidate.libraryItemId),
    )
    expect(capped.tracks).toHaveLength(3)

    const many = request()
    const defaults = parsePlaylistGenerationProviderOutput(
      await provider.generate({ ...many, trackCountHint: undefined }),
      many.candidates.map((candidate) => candidate.libraryItemId),
    )
    expect(defaults.tracks).toHaveLength(12)
  })

  it('throws typed errors for timeout and unavailable', async () => {
    await expect(
      new MockPlaylistGenerationProvider({ mode: 'timeout' }).generate(
        request(),
      ),
    ).rejects.toMatchObject({
      code: PLAYLIST_GENERATION_PROVIDER_ERROR_CODES.PROVIDER_TIMEOUT,
    })

    await expect(
      new MockPlaylistGenerationProvider({ mode: 'unavailable' }).generate(
        request(),
      ),
    ).rejects.toMatchObject({
      code: PLAYLIST_GENERATION_PROVIDER_ERROR_CODES.PROVIDER_UNAVAILABLE,
    })
  })

  it('produces fixtures that Domain parser rejects for bad modes', async () => {
    const input = request({ trackCountHint: 3 })
    const allowed = input.candidates.map((candidate) => candidate.libraryItemId)

    const hallucinated = await new MockPlaylistGenerationProvider({
      mode: 'hallucinated_id',
    }).generate(input)
    try {
      parsePlaylistGenerationProviderOutput(hallucinated, allowed)
      expect.unreachable('expected hallucinated rejection')
    } catch (error) {
      expect(error).toBeInstanceOf(PlaylistGenerationProviderError)
      expect((error as PlaylistGenerationProviderError).code).toBe(
        PLAYLIST_GENERATION_PROVIDER_ERROR_CODES.INVALID_PROVIDER_PROPOSAL,
      )
    }

    const duplicate = await new MockPlaylistGenerationProvider({
      mode: 'duplicate_id',
    }).generate(input)
    try {
      parsePlaylistGenerationProviderOutput(duplicate, allowed)
      expect.unreachable('expected duplicate rejection')
    } catch (error) {
      expect((error as PlaylistGenerationProviderError).code).toBe(
        PLAYLIST_GENERATION_PROVIDER_ERROR_CODES.INVALID_PROVIDER_PROPOSAL,
      )
    }

    const empty = await new MockPlaylistGenerationProvider({
      mode: 'empty',
    }).generate(input)
    try {
      parsePlaylistGenerationProviderOutput(empty, allowed)
      expect.unreachable('expected empty rejection')
    } catch (error) {
      expect((error as PlaylistGenerationProviderError).code).toBe(
        PLAYLIST_GENERATION_PROVIDER_ERROR_CODES.EMPTY_PROVIDER_PROPOSAL,
      )
    }

    const malformed = await new MockPlaylistGenerationProvider({
      mode: 'malformed',
    }).generate(input)
    try {
      parsePlaylistGenerationProviderOutput(malformed, allowed)
      expect.unreachable('expected malformed rejection')
    } catch (error) {
      expect((error as PlaylistGenerationProviderError).code).toBe(
        PLAYLIST_GENERATION_PROVIDER_ERROR_CODES.INVALID_PROVIDER_RESPONSE,
      )
    }
  })
})

describe('toPlaylistGenerationCandidate', () => {
  it('maps shortlist fields without leaking tenancy internals', () => {
    const candidate: SessionCandidate = {
      libraryItemId: '11111111-1111-4111-8111-111111111111',
      trackId: '22222222-2222-4222-8222-222222222222',
      title: 'Smoke Track',
      artists: [{ id: '33333333-3333-4333-8333-333333333333', name: 'DJ One' }],
      effectiveBpm: 121,
      effectiveCamelotKey: '8A',
      durationMs: 180_000,
      energy: 4,
      rating: 5,
      familiarity: 2,
      isFavorite: true,
      tags: [
        {
          id: '44444444-4444-4444-8444-444444444444',
          name: 'Afro House',
          normalizedName: 'afro house',
        },
      ],
      score: 87.5,
      scoreBreakdown: {
        bpm: 35,
        rating: 15,
        familiarity: 5,
        favorite: 10,
        tags: 15,
        energy: 10,
        camelot: 5,
      },
    }

    const mapped = toPlaylistGenerationCandidate(candidate)
    expect(mapped).toEqual({
      libraryItemId: candidate.libraryItemId,
      title: 'Smoke Track',
      artists: ['DJ One'],
      effectiveBpm: 121,
      effectiveCamelotKey: '8A',
      durationMs: 180_000,
      energy: 4,
      rating: 5,
      familiarity: 2,
      isFavorite: true,
      tags: ['Afro House'],
      candidateScore: 87.5,
    })
    expect(mapped).not.toHaveProperty('organizationId')
    expect(mapped).not.toHaveProperty('profileId')
    expect(mapped).not.toHaveProperty('trackId')
    expect(mapped).not.toHaveProperty('scoreBreakdown')
  })
})
