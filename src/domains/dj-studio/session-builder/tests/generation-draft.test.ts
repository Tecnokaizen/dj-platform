import { describe, expect, it, vi } from 'vitest'

import {
  buildSessionBuilderDraft,
  computeEstimatedStartMs,
  generateSessionProposalFromShortlist,
  parseSessionGenerationInput,
} from '@/domains/dj-studio/session-builder/generation'
import {
  PLAYLIST_GENERATION_PROVIDER_ERROR_CODES,
  type PlaylistGenerationProvider,
  type ValidatedPlaylistGenerationProposal,
} from '@/domains/dj-studio/session-builder/provider'
import type { SessionCandidate } from '@/domains/dj-studio/session-builder/types'
import { MockPlaylistGenerationProvider } from '@/lib/ai/providers/mock-playlist-generation-provider'

function candidate(
  overrides: Partial<SessionCandidate> & {
    libraryItemId: string
    title: string
  },
): SessionCandidate {
  return {
    trackId: `track-${overrides.libraryItemId}`,
    artists: [{ id: `artist-${overrides.libraryItemId}`, name: 'Artist' }],
    effectiveBpm: 120,
    effectiveCamelotKey: '8A',
    durationMs: 180_000,
    energy: 3,
    rating: 4,
    familiarity: 3,
    isFavorite: false,
    tags: [],
    score: 50,
    scoreBreakdown: {
      bpm: 10,
      rating: 10,
      familiarity: 5,
      favorite: 0,
      tags: 0,
      energy: 10,
      camelot: 5,
    },
    ...overrides,
  }
}

const IDS = {
  a: 'aaaaaaaa-aaaa-4aaa-8aaa-000000000001',
  b: 'bbbbbbbb-bbbb-4bbb-8bbb-000000000002',
  c: 'cccccccc-cccc-4ccc-8ccc-000000000003',
  d: 'dddddddd-dddd-4ddd-8ddd-000000000004',
} as const

function baseInput() {
  return parseSessionGenerationInput({
    prompt: 'sunset afro house',
    targetDurationMin: 90,
    energyCurve: 'gradual_rise',
    source: 'library_only',
    bpm: { start: 118, end: 123 },
    trackCountHint: 3,
  })
}

function proposalFromTracks(
  tracks: ValidatedPlaylistGenerationProposal['tracks'],
  warnings: ValidatedPlaylistGenerationProposal['warnings'] = [],
): ValidatedPlaylistGenerationProposal {
  return {
    title: 'Propuesta de sesión',
    summary: 'Resumen',
    tracks,
    energyProgression: 'Curva solicitada: gradual_rise',
    bpmProgression: { start: 999, end: 1, notes: 'Notas del provider' },
    warnings,
  }
}

describe('computeEstimatedStartMs', () => {
  it('accumulates known durations and freezes after null', () => {
    expect(
      computeEstimatedStartMs([300_000, 240_000, null, 250_000]),
    ).toEqual([0, 300_000, 540_000, null])
  })
})

describe('buildSessionBuilderDraft', () => {
  it('preserves provider order and Domain metadata authority', () => {
    const candidates = [
      candidate({
        libraryItemId: IDS.a,
        title: 'Track A',
        effectiveBpm: 118,
        effectiveCamelotKey: '8A',
        durationMs: 300_000,
        energy: 2,
      }),
      candidate({
        libraryItemId: IDS.b,
        title: 'Track B',
        effectiveBpm: 119,
        effectiveCamelotKey: '9A',
        durationMs: 240_000,
        energy: 3,
        artists: [{ id: 'b-art', name: 'DJ B' }],
      }),
      candidate({
        libraryItemId: IDS.c,
        title: 'Track C',
        effectiveBpm: 120,
        effectiveCamelotKey: '8B',
        durationMs: null,
        energy: null,
      }),
      candidate({
        libraryItemId: IDS.d,
        title: 'Track D',
        effectiveBpm: 121,
        effectiveCamelotKey: '10A',
        durationMs: 250_000,
        energy: 4,
      }),
    ]

    const draft = buildSessionBuilderDraft({
      input: baseInput(),
      candidates,
      proposal: proposalFromTracks([
        {
          libraryItemId: IDS.b,
          position: 1,
          transitionNote: 't1',
          reason: 'r1',
        },
        {
          libraryItemId: IDS.a,
          position: 0,
          transitionNote: null,
          reason: 'r0',
        },
        {
          libraryItemId: IDS.c,
          position: 2,
          transitionNote: 't2',
          reason: 'r2',
        },
        {
          libraryItemId: IDS.d,
          position: 3,
          transitionNote: 't3',
          reason: 'r3',
        },
      ]),
    })

    expect(draft.tracks.map((track) => track.libraryItemId)).toEqual([
      IDS.a,
      IDS.b,
      IDS.c,
      IDS.d,
    ])
    expect(draft.tracks.map((track) => track.position)).toEqual([0, 1, 2, 3])
    expect(draft.tracks[0]).toMatchObject({
      title: 'Track A',
      bpmEffective: 118,
      camelotEffective: '8A',
      estimatedStartMs: 0,
      reason: 'r0',
    })
    expect(draft.tracks[1]).toMatchObject({
      title: 'Track B',
      artists: ['DJ B'],
      estimatedStartMs: 300_000,
    })
    expect(draft.tracks[2].estimatedStartMs).toBe(540_000)
    expect(draft.tracks[3].estimatedStartMs).toBeNull()
    expect(draft.bpmProgression).toEqual({
      start: 118,
      end: 121,
      classification: 'ascending',
      notes: 'Notas del provider',
    })
    expect(draft.estimatedDurationMode).toBe('approximate')
    expect(draft.warnings.some((w) => w.code === 'DURATION_METADATA_PARTIAL')).toBe(
      true,
    )
    expect(draft.warnings.some((w) => w.code === 'MISSING_BPM_METADATA')).toBe(false)
    expect(
      draft.warnings.some((w) => w.code === 'ENERGY_METADATA_INCOMPLETE'),
    ).toBe(true)
  })

  it('emits BPM_LARGE_JUMP and CAMELOT_INCOMPATIBLE when warranted', () => {
    const candidates = [
      candidate({
        libraryItemId: IDS.a,
        title: 'Alpha',
        effectiveBpm: 118,
        effectiveCamelotKey: '8A',
        durationMs: 180_000,
      }),
      candidate({
        libraryItemId: IDS.b,
        title: 'Beta',
        effectiveBpm: 123,
        effectiveCamelotKey: '10A',
        durationMs: 180_000,
      }),
    ]

    const draft = buildSessionBuilderDraft({
      input: baseInput(),
      candidates,
      proposal: proposalFromTracks([
        {
          libraryItemId: IDS.a,
          position: 0,
          transitionNote: null,
          reason: 'a',
        },
        {
          libraryItemId: IDS.b,
          position: 1,
          transitionNote: null,
          reason: 'b',
        },
      ]),
    })

    expect(draft.estimatedDurationMode).toBe('exact')
    expect(draft.warnings).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          code: 'BPM_LARGE_JUMP',
          message: 'Salto de 5 BPM entre Alpha y Beta.',
        }),
        expect.objectContaining({ code: 'CAMELOT_INCOMPATIBLE' }),
      ]),
    )
  })

  it('does not warn on compatible Camelot or missing BPM/Camelot jumps', () => {
    const candidates = [
      candidate({
        libraryItemId: IDS.a,
        title: 'A',
        effectiveBpm: 118,
        effectiveCamelotKey: '8A',
        durationMs: 100_000,
      }),
      candidate({
        libraryItemId: IDS.b,
        title: 'B',
        effectiveBpm: 119,
        effectiveCamelotKey: '9A',
        durationMs: 100_000,
      }),
      candidate({
        libraryItemId: IDS.c,
        title: 'C',
        effectiveBpm: null,
        effectiveCamelotKey: null,
        durationMs: null,
      }),
      candidate({
        libraryItemId: IDS.d,
        title: 'D',
        effectiveBpm: 120,
        effectiveCamelotKey: '8B',
        durationMs: 100_000,
      }),
    ]

    const draft = buildSessionBuilderDraft({
      input: baseInput(),
      candidates,
      proposal: proposalFromTracks([
        {
          libraryItemId: IDS.a,
          position: 0,
          transitionNote: null,
          reason: 'a',
        },
        {
          libraryItemId: IDS.b,
          position: 1,
          transitionNote: null,
          reason: 'b',
        },
        {
          libraryItemId: IDS.c,
          position: 2,
          transitionNote: null,
          reason: 'c',
        },
        {
          libraryItemId: IDS.d,
          position: 3,
          transitionNote: null,
          reason: 'd',
        },
      ]),
    })

    expect(draft.warnings.some((w) => w.code === 'BPM_LARGE_JUMP')).toBe(false)
    expect(draft.warnings.some((w) => w.code === 'CAMELOT_INCOMPATIBLE')).toBe(
      false,
    )
    expect(draft.warnings.some((w) => w.code === 'MISSING_BPM_METADATA')).toBe(
      true,
    )
    expect(
      draft.warnings.some((w) => w.code === 'MISSING_CAMELOT_METADATA'),
    ).toBe(true)
    expect(draft.estimatedDurationMode).toBe('approximate')
  })

  it('marks unknown duration when no lengths exist', () => {
    const candidates = [
      candidate({
        libraryItemId: IDS.a,
        title: 'A',
        durationMs: null,
      }),
      candidate({
        libraryItemId: IDS.b,
        title: 'B',
        durationMs: null,
      }),
    ]
    const draft = buildSessionBuilderDraft({
      input: baseInput(),
      candidates,
      proposal: proposalFromTracks([
        {
          libraryItemId: IDS.a,
          position: 0,
          transitionNote: null,
          reason: 'a',
        },
        {
          libraryItemId: IDS.b,
          position: 1,
          transitionNote: null,
          reason: 'b',
        },
      ]),
    })
    expect(draft.estimatedDurationMs).toBeNull()
    expect(draft.estimatedDurationMode).toBe('unknown')
    expect(
      draft.warnings.some((w) => w.code === 'DURATION_METADATA_UNKNOWN'),
    ).toBe(true)
  })
})

describe('generateSessionProposalFromShortlist + Mock provider', () => {
  const shortlist = [
    candidate({ libraryItemId: IDS.a, title: 'A', effectiveBpm: 118 }),
    candidate({ libraryItemId: IDS.b, title: 'B', effectiveBpm: 119 }),
    candidate({ libraryItemId: IDS.c, title: 'C', effectiveBpm: 120 }),
  ]

  it('returns a draft on success and calls provider once with safe request', async () => {
    const generate = vi.fn(
      new MockPlaylistGenerationProvider({ mode: 'success' }).generate.bind(
        new MockPlaylistGenerationProvider({ mode: 'success' }),
      ),
    )
    const provider: PlaylistGenerationProvider = { generate }

    const draft = await generateSessionProposalFromShortlist({
      input: baseInput(),
      shortlist,
      provider,
    })

    expect(generate).toHaveBeenCalledTimes(1)
    const request = generate.mock.calls[0][0]
    expect(request.prompt).toBe('sunset afro house')
    expect(request.targetDurationMin).toBe(90)
    expect(request.energyCurve).toBe('gradual_rise')
    expect(request.trackCountHint).toBe(3)
    expect(request.candidates).toHaveLength(3)
    expect(request).not.toHaveProperty('organizationId')
    expect(request).not.toHaveProperty('profileId')
    expect(draft.title).toBe('Propuesta de sesión')
    expect(draft.tracks).toHaveLength(3)
  })

  it('propagates typed provider and parser failures', async () => {
    await expect(
      generateSessionProposalFromShortlist({
        input: baseInput(),
        shortlist,
        provider: new MockPlaylistGenerationProvider({ mode: 'timeout' }),
      }),
    ).rejects.toMatchObject({
      code: PLAYLIST_GENERATION_PROVIDER_ERROR_CODES.PROVIDER_TIMEOUT,
    })

    await expect(
      generateSessionProposalFromShortlist({
        input: baseInput(),
        shortlist,
        provider: new MockPlaylistGenerationProvider({ mode: 'unavailable' }),
      }),
    ).rejects.toMatchObject({
      code: PLAYLIST_GENERATION_PROVIDER_ERROR_CODES.PROVIDER_UNAVAILABLE,
    })

    await expect(
      generateSessionProposalFromShortlist({
        input: baseInput(),
        shortlist,
        provider: new MockPlaylistGenerationProvider({ mode: 'malformed' }),
      }),
    ).rejects.toMatchObject({
      code: PLAYLIST_GENERATION_PROVIDER_ERROR_CODES.INVALID_PROVIDER_RESPONSE,
    })

    await expect(
      generateSessionProposalFromShortlist({
        input: baseInput(),
        shortlist,
        provider: new MockPlaylistGenerationProvider({ mode: 'hallucinated_id' }),
      }),
    ).rejects.toMatchObject({
      code: PLAYLIST_GENERATION_PROVIDER_ERROR_CODES.INVALID_PROVIDER_PROPOSAL,
    })

    await expect(
      generateSessionProposalFromShortlist({
        input: baseInput(),
        shortlist,
        provider: new MockPlaylistGenerationProvider({ mode: 'duplicate_id' }),
      }),
    ).rejects.toMatchObject({
      code: PLAYLIST_GENERATION_PROVIDER_ERROR_CODES.INVALID_PROVIDER_PROPOSAL,
    })

    await expect(
      generateSessionProposalFromShortlist({
        input: baseInput(),
        shortlist,
        provider: new MockPlaylistGenerationProvider({ mode: 'empty' }),
      }),
    ).rejects.toMatchObject({
      code: PLAYLIST_GENERATION_PROVIDER_ERROR_CODES.EMPTY_PROVIDER_PROPOSAL,
    })
  })
})
