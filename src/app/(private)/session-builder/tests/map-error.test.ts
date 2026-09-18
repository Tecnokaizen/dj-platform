import { describe, expect, it } from 'vitest'

import {
  mapSessionBuilderError,
  SESSION_BUILDER_PRODUCT_ERRORS,
} from '@/app/(private)/session-builder/map-error'
import {
  DJ_STUDIO_ERROR_CODES,
  DjStudioError,
} from '@/domains/dj-studio/shared/errors'
import {
  PLAYLIST_GENERATION_PROVIDER_ERROR_CODES,
  PlaylistGenerationProviderError,
} from '@/domains/dj-studio/session-builder/provider'

describe('mapSessionBuilderError', () => {
  it('maps Domain and Provider errors to safe Product copy', () => {
    expect(
      mapSessionBuilderError(
        new DjStudioError(DJ_STUDIO_ERROR_CODES.VALIDATION_ERROR),
      ),
    ).toBe(SESSION_BUILDER_PRODUCT_ERRORS.VALIDATION)

    expect(
      mapSessionBuilderError(
        new DjStudioError(DJ_STUDIO_ERROR_CODES.INSUFFICIENT_SESSION_CANDIDATES),
      ),
    ).toBe(SESSION_BUILDER_PRODUCT_ERRORS.INSUFFICIENT_CANDIDATES)

    expect(
      mapSessionBuilderError(new DjStudioError(DJ_STUDIO_ERROR_CODES.FORBIDDEN)),
    ).toBe(SESSION_BUILDER_PRODUCT_ERRORS.FORBIDDEN)

    expect(
      mapSessionBuilderError(
        new PlaylistGenerationProviderError(
          PLAYLIST_GENERATION_PROVIDER_ERROR_CODES.PROVIDER_TIMEOUT,
        ),
      ),
    ).toBe(SESSION_BUILDER_PRODUCT_ERRORS.PROVIDER_TIMEOUT)

    expect(
      mapSessionBuilderError(
        new PlaylistGenerationProviderError(
          PLAYLIST_GENERATION_PROVIDER_ERROR_CODES.PROVIDER_UNAVAILABLE,
        ),
      ),
    ).toBe(SESSION_BUILDER_PRODUCT_ERRORS.PROVIDER_UNAVAILABLE)

    expect(
      mapSessionBuilderError(
        new PlaylistGenerationProviderError(
          PLAYLIST_GENERATION_PROVIDER_ERROR_CODES.INVALID_PROVIDER_PROPOSAL,
        ),
      ),
    ).toBe(SESSION_BUILDER_PRODUCT_ERRORS.INVALID_PROPOSAL)

    expect(
      mapSessionBuilderError(
        new PlaylistGenerationProviderError(
          PLAYLIST_GENERATION_PROVIDER_ERROR_CODES.EMPTY_PROVIDER_PROPOSAL,
        ),
      ),
    ).toBe(SESSION_BUILDER_PRODUCT_ERRORS.INVALID_PROPOSAL)
  })

  it('never exposes raw internals', () => {
    const message = mapSessionBuilderError(
      new Error('Prisma P2002 secret=abc stack'),
    )
    expect(message).toBe(SESSION_BUILDER_PRODUCT_ERRORS.GENERIC)
    expect(message).not.toContain('Prisma')
    expect(message).not.toContain('secret')
  })
})
