import { describe, expect, it } from 'vitest'

import {
  PLAYLIST_GENERATION_PROVIDER_ERROR_CODES,
  PlaylistGenerationProviderError,
  parsePlaylistGenerationProviderOutput,
} from '@/domains/dj-studio/session-builder/provider'
import { buildMalformedProviderFixture } from '@/lib/ai/providers/mock-playlist-generation-provider'

const ALLOWED = [
  '11111111-1111-4111-8111-111111111111',
  '22222222-2222-4222-8222-222222222222',
  '33333333-3333-4333-8333-333333333333',
] as const

function validPayload(overrides: Record<string, unknown> = {}) {
  return {
    title: 'Propuesta de sesión',
    summary: 'Resumen estable',
    tracks: [
      {
        libraryItemId: ALLOWED[0],
        position: 0,
        transitionNote: null,
        reason: 'Seleccionado por el motor de candidatos.',
      },
      {
        libraryItemId: ALLOWED[1],
        position: 1,
        transitionNote: 'Transición propuesta.',
        reason: 'Seleccionado por el motor de candidatos.',
      },
    ],
    energyProgression: 'Curva solicitada: steady',
    bpmProgression: { start: 118, end: 123, notes: null },
    warnings: [],
    ...overrides,
  }
}

describe('parsePlaylistGenerationProviderOutput', () => {
  it('accepts a valid success payload and orders tracks by position', () => {
    const parsed = parsePlaylistGenerationProviderOutput(
      validPayload({
        tracks: [
          {
            libraryItemId: ALLOWED[1],
            position: 1,
            transitionNote: 'Transición propuesta.',
            reason: 'Seleccionado por el motor de candidatos.',
          },
          {
            libraryItemId: ALLOWED[0],
            position: 0,
            transitionNote: null,
            reason: 'Seleccionado por el motor de candidatos.',
          },
        ],
      }),
      ALLOWED,
    )

    expect(parsed.tracks.map((track) => track.libraryItemId)).toEqual([
      ALLOWED[0],
      ALLOWED[1],
    ])
  })

  it('rejects empty tracks', () => {
    expect(() =>
      parsePlaylistGenerationProviderOutput(validPayload({ tracks: [] }), ALLOWED),
    ).toThrow(PlaylistGenerationProviderError)

    try {
      parsePlaylistGenerationProviderOutput(validPayload({ tracks: [] }), ALLOWED)
    } catch (error) {
      expect((error as PlaylistGenerationProviderError).code).toBe(
        PLAYLIST_GENERATION_PROVIDER_ERROR_CODES.EMPTY_PROVIDER_PROPOSAL,
      )
    }
  })

  it('rejects unknown candidate IDs', () => {
    try {
      parsePlaylistGenerationProviderOutput(
        validPayload({
          tracks: [
            {
              libraryItemId: '99999999-9999-4999-8999-999999999999',
              position: 0,
              transitionNote: null,
              reason: 'Inventado',
            },
          ],
        }),
        ALLOWED,
      )
      expect.unreachable('expected rejection')
    } catch (error) {
      expect(error).toBeInstanceOf(PlaylistGenerationProviderError)
      expect((error as PlaylistGenerationProviderError).code).toBe(
        PLAYLIST_GENERATION_PROVIDER_ERROR_CODES.INVALID_PROVIDER_PROPOSAL,
      )
    }
  })

  it('rejects duplicate libraryItemIds', () => {
    try {
      parsePlaylistGenerationProviderOutput(
        validPayload({
          tracks: [
            {
              libraryItemId: ALLOWED[0],
              position: 0,
              transitionNote: null,
              reason: 'A',
            },
            {
              libraryItemId: ALLOWED[0],
              position: 1,
              transitionNote: null,
              reason: 'B',
            },
          ],
        }),
        ALLOWED,
      )
      expect.unreachable('expected rejection')
    } catch (error) {
      expect((error as PlaylistGenerationProviderError).code).toBe(
        PLAYLIST_GENERATION_PROVIDER_ERROR_CODES.INVALID_PROVIDER_PROPOSAL,
      )
    }
  })

  it('rejects duplicate and gapped positions', () => {
    try {
      parsePlaylistGenerationProviderOutput(
        validPayload({
          tracks: [
            {
              libraryItemId: ALLOWED[0],
              position: 0,
              transitionNote: null,
              reason: 'A',
            },
            {
              libraryItemId: ALLOWED[1],
              position: 0,
              transitionNote: null,
              reason: 'B',
            },
          ],
        }),
        ALLOWED,
      )
      expect.unreachable('expected rejection')
    } catch (error) {
      expect((error as PlaylistGenerationProviderError).code).toBe(
        PLAYLIST_GENERATION_PROVIDER_ERROR_CODES.INVALID_PROVIDER_PROPOSAL,
      )
    }

    try {
      parsePlaylistGenerationProviderOutput(
        validPayload({
          tracks: [
            {
              libraryItemId: ALLOWED[0],
              position: 0,
              transitionNote: null,
              reason: 'A',
            },
            {
              libraryItemId: ALLOWED[1],
              position: 2,
              transitionNote: null,
              reason: 'B',
            },
          ],
        }),
        ALLOWED,
      )
      expect.unreachable('expected rejection')
    } catch (error) {
      expect((error as PlaylistGenerationProviderError).code).toBe(
        PLAYLIST_GENERATION_PROVIDER_ERROR_CODES.INVALID_PROVIDER_PROPOSAL,
      )
    }
  })

  it('rejects negative positions and malformed / oversized fields', () => {
    try {
      parsePlaylistGenerationProviderOutput(
        validPayload({
          tracks: [
            {
              libraryItemId: ALLOWED[0],
              position: -1,
              transitionNote: null,
              reason: 'A',
            },
          ],
        }),
        ALLOWED,
      )
      expect.unreachable('expected rejection')
    } catch (error) {
      expect((error as PlaylistGenerationProviderError).code).toBe(
        PLAYLIST_GENERATION_PROVIDER_ERROR_CODES.INVALID_PROVIDER_RESPONSE,
      )
    }

    try {
      parsePlaylistGenerationProviderOutput(validPayload({ title: '' }), ALLOWED)
      expect.unreachable('expected rejection')
    } catch (error) {
      expect((error as PlaylistGenerationProviderError).code).toBe(
        PLAYLIST_GENERATION_PROVIDER_ERROR_CODES.INVALID_PROVIDER_RESPONSE,
      )
    }

    try {
      parsePlaylistGenerationProviderOutput(
        validPayload({ title: 'x'.repeat(201) }),
        ALLOWED,
      )
      expect.unreachable('expected rejection')
    } catch (error) {
      expect((error as PlaylistGenerationProviderError).code).toBe(
        PLAYLIST_GENERATION_PROVIDER_ERROR_CODES.INVALID_PROVIDER_RESPONSE,
      )
    }

    try {
      parsePlaylistGenerationProviderOutput(
        validPayload({ summary: 'y'.repeat(2001) }),
        ALLOWED,
      )
      expect.unreachable('expected rejection')
    } catch (error) {
      expect((error as PlaylistGenerationProviderError).code).toBe(
        PLAYLIST_GENERATION_PROVIDER_ERROR_CODES.INVALID_PROVIDER_RESPONSE,
      )
    }

    try {
      parsePlaylistGenerationProviderOutput(
        validPayload({
          warnings: [
            {
              code: 'X',
              message: 'bad',
              severity: 'critical',
            },
          ],
        }),
        ALLOWED,
      )
      expect.unreachable('expected rejection')
    } catch (error) {
      expect((error as PlaylistGenerationProviderError).code).toBe(
        PLAYLIST_GENERATION_PROVIDER_ERROR_CODES.INVALID_PROVIDER_RESPONSE,
      )
    }

    try {
      parsePlaylistGenerationProviderOutput(
        buildMalformedProviderFixture(),
        ALLOWED,
      )
      expect.unreachable('expected rejection')
    } catch (error) {
      expect((error as PlaylistGenerationProviderError).code).toBe(
        PLAYLIST_GENERATION_PROVIDER_ERROR_CODES.INVALID_PROVIDER_RESPONSE,
      )
    }
  })
})
