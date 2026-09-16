import 'server-only'

import type { PlaylistGenerationProvider } from '@/domains/dj-studio/session-builder/provider/playlist-generation-provider'
import {
  PLAYLIST_GENERATION_PROVIDER_ERROR_CODES,
  PlaylistGenerationProviderError,
} from '@/domains/dj-studio/session-builder/provider/provider-errors'
import type {
  PlaylistGenerationCandidate,
  PlaylistGenerationRequest,
} from '@/domains/dj-studio/session-builder/provider/provider-types'

export type MockPlaylistGenerationMode =
  | 'success'
  | 'timeout'
  | 'unavailable'
  | 'malformed'
  | 'hallucinated_id'
  | 'duplicate_id'
  | 'empty'

export type MockPlaylistGenerationProviderOptions = {
  mode?: MockPlaylistGenerationMode
}

const DEFAULT_TRACK_COUNT = 12
const HALLUCINATED_LIBRARY_ITEM_ID = '00000000-0000-4000-8000-000000000099'

function resolveDesiredCount(request: PlaylistGenerationRequest): number {
  const available = request.candidates.length
  if (available === 0) {
    return 0
  }

  if (
    typeof request.trackCountHint === 'number' &&
    Number.isInteger(request.trackCountHint) &&
    request.trackCountHint > 0
  ) {
    return Math.min(request.trackCountHint, available)
  }

  return Math.min(DEFAULT_TRACK_COUNT, available)
}

function buildSuccessPayload(request: PlaylistGenerationRequest) {
  const count = resolveDesiredCount(request)
  const selected = request.candidates.slice(0, count)

  const warnings = []
  for (const candidate of selected) {
    if (candidate.effectiveBpm === null) {
      warnings.push({
        code: 'MISSING_BPM',
        message: `Missing effective BPM for ${candidate.libraryItemId}`,
        severity: 'info' as const,
      })
    }
    if (candidate.effectiveCamelotKey === null) {
      warnings.push({
        code: 'MISSING_CAMELOT',
        message: `Missing Camelot key for ${candidate.libraryItemId}`,
        severity: 'info' as const,
      })
    }
  }

  return {
    title: 'Propuesta de sesión',
    summary: `Propuesta determinista para: ${request.prompt.trim()}`,
    tracks: selected.map((candidate, index) => ({
      libraryItemId: candidate.libraryItemId,
      position: index,
      transitionNote: index === 0 ? null : 'Transición propuesta.',
      reason: 'Seleccionado por el motor de candidatos.',
    })),
    energyProgression: `Curva solicitada: ${request.energyCurve}`,
    bpmProgression: {
      start: request.bpm?.start ?? null,
      end: request.bpm?.end ?? null,
      notes: null,
    },
    warnings,
  }
}

/**
 * Deterministic CI fixture provider. No network / DB / randomness.
 * Returns untrusted payloads; Domain must parsePlaylistGenerationProviderOutput.
 */
export class MockPlaylistGenerationProvider
  implements PlaylistGenerationProvider
{
  private readonly mode: MockPlaylistGenerationMode

  constructor(options: MockPlaylistGenerationProviderOptions = {}) {
    this.mode = options.mode ?? 'success'
  }

  async generate(request: PlaylistGenerationRequest): Promise<unknown> {
    switch (this.mode) {
      case 'timeout':
        throw new PlaylistGenerationProviderError(
          PLAYLIST_GENERATION_PROVIDER_ERROR_CODES.PROVIDER_TIMEOUT,
          'Mock provider timed out',
        )
      case 'unavailable':
        throw new PlaylistGenerationProviderError(
          PLAYLIST_GENERATION_PROVIDER_ERROR_CODES.PROVIDER_UNAVAILABLE,
          'Mock provider unavailable',
        )
      case 'malformed':
        return buildMalformedProviderFixture()
      case 'hallucinated_id': {
        const payload = buildSuccessPayload(request)
        if (payload.tracks.length === 0) {
          return {
            ...payload,
            tracks: [
              {
                libraryItemId: HALLUCINATED_LIBRARY_ITEM_ID,
                position: 0,
                transitionNote: null,
                reason: 'Hallucinated candidate.',
              },
            ],
          }
        }
        payload.tracks[0] = {
          ...payload.tracks[0],
          libraryItemId: HALLUCINATED_LIBRARY_ITEM_ID,
        }
        return payload
      }
      case 'duplicate_id': {
        const payload = buildSuccessPayload(request)
        if (request.candidates.length === 0) {
          return { ...payload, tracks: [] }
        }
        const first = request.candidates[0]
        return {
          ...payload,
          tracks: [
            {
              libraryItemId: first.libraryItemId,
              position: 0,
              transitionNote: null,
              reason: 'Seleccionado por el motor de candidatos.',
            },
            {
              libraryItemId: first.libraryItemId,
              position: 1,
              transitionNote: 'Transición propuesta.',
              reason: 'Seleccionado por el motor de candidatos.',
            },
          ],
        }
      }
      case 'empty': {
        const payload = buildSuccessPayload(request)
        return { ...payload, tracks: [] }
      }
      case 'success':
      default:
        return buildSuccessPayload(request)
    }
  }
}

/** Fixture for malformed raw provider output (parser tests). */
export function buildMalformedProviderFixture(): unknown {
  return {
    title: 123,
    summary: true,
    tracks: 'not-an-array',
    energyProgression: null,
    bpmProgression: {},
    warnings: [{ severity: 'critical' }],
  }
}

export function createMockCandidate(
  overrides: Partial<PlaylistGenerationCandidate> & { libraryItemId: string },
): PlaylistGenerationCandidate {
  return {
    title: `Track ${overrides.libraryItemId}`,
    artists: ['Artist'],
    effectiveBpm: 120,
    effectiveCamelotKey: '8A',
    durationMs: 180_000,
    energy: 3,
    rating: 4,
    familiarity: 3,
    isFavorite: false,
    tags: [],
    candidateScore: 50,
    ...overrides,
  }
}
