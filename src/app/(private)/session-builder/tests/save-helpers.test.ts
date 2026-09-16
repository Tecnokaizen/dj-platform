import { describe, expect, it } from 'vitest'

import {
  buildSessionBuilderSavePayload,
  shouldShowSessionBuilderSaveCta,
} from '@/app/(private)/session-builder/save-payload'
import {
  mapSessionBuilderSaveError,
  SESSION_BUILDER_SAVE_PRODUCT_ERRORS,
} from '@/app/(private)/session-builder/map-error'
import {
  DJ_STUDIO_ERROR_CODES,
  DjStudioError,
} from '@/domains/dj-studio/shared/errors'

describe('session builder save payload helpers', () => {
  it('builds minimal payload without Domain metadata', () => {
    const payload = buildSessionBuilderSavePayload({
      name: 'Propuesta',
      prompt: 'sunset',
      tracks: [
        {
          libraryItemId: 'aaaaaaaa-aaaa-4aaa-8aaa-000000000001',
          transitionNote: null,
        },
      ],
    })
    expect(payload).toEqual({
      name: 'Propuesta',
      prompt: 'sunset',
      tracks: [
        {
          libraryItemId: 'aaaaaaaa-aaaa-4aaa-8aaa-000000000001',
          transitionNote: null,
        },
      ],
    })
    expect(payload).not.toHaveProperty('organizationId')
    expect(payload).not.toHaveProperty('playlistType')
  })

  it('shows Save CTA only with unsaved draft', () => {
    expect(
      shouldShowSessionBuilderSaveCta({
        hasDraft: false,
        savedPlaylistId: null,
      }),
    ).toBe(false)
    expect(
      shouldShowSessionBuilderSaveCta({
        hasDraft: true,
        savedPlaylistId: null,
      }),
    ).toBe(true)
    expect(
      shouldShowSessionBuilderSaveCta({
        hasDraft: true,
        savedPlaylistId: 'playlist-id',
      }),
    ).toBe(false)
  })
})

describe('mapSessionBuilderSaveError', () => {
  it('maps validation, forbidden, stale, and generic safely', () => {
    expect(
      mapSessionBuilderSaveError(
        new DjStudioError(DJ_STUDIO_ERROR_CODES.VALIDATION_ERROR),
      ),
    ).toBe(SESSION_BUILDER_SAVE_PRODUCT_ERRORS.VALIDATION)

    expect(
      mapSessionBuilderSaveError(
        new DjStudioError(DJ_STUDIO_ERROR_CODES.FORBIDDEN),
      ),
    ).toBe(SESSION_BUILDER_SAVE_PRODUCT_ERRORS.FORBIDDEN)

    expect(
      mapSessionBuilderSaveError(
        new DjStudioError(DJ_STUDIO_ERROR_CODES.SESSION_BUILDER_STALE_DRAFT),
      ),
    ).toBe(SESSION_BUILDER_SAVE_PRODUCT_ERRORS.STALE)

    const generic = mapSessionBuilderSaveError(new Error('Prisma P2002 secret'))
    expect(generic).toBe(SESSION_BUILDER_SAVE_PRODUCT_ERRORS.GENERIC)
    expect(generic).not.toContain('Prisma')
  })
})
