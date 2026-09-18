import { beforeEach, describe, expect, it, vi } from 'vitest'

import { saveSessionBuilderPlaylistAction } from '@/app/(private)/session-builder/actions'
import { SESSION_BUILDER_SAVE_PRODUCT_ERRORS } from '@/app/(private)/session-builder/map-error'
import type { ActiveOrganizationContext } from '@/domains/dj-studio/organization/types'
import {
  DJ_STUDIO_ERROR_CODES,
  DjStudioError,
} from '@/domains/dj-studio/shared/errors'

vi.mock('@/domains/dj-studio/organization/resolve-active-organization', () => ({
  resolveActiveOrganization: vi.fn(),
}))

vi.mock(
  '@/domains/dj-studio/session-builder/services/save-session-builder-playlist',
  () => ({
    saveSessionBuilderDraftAsPlaylist: vi.fn(),
  }),
)

import { resolveActiveOrganization } from '@/domains/dj-studio/organization/resolve-active-organization'
import { saveSessionBuilderDraftAsPlaylist } from '@/domains/dj-studio/session-builder/services/save-session-builder-playlist'

const resolveMock = vi.mocked(resolveActiveOrganization)
const saveMock = vi.mocked(saveSessionBuilderDraftAsPlaylist)

const context: ActiveOrganizationContext = {
  profileId: '11111111-1111-4111-8111-111111111111',
  organizationId: '22222222-2222-4222-8222-222222222222',
  membershipId: '33333333-3333-4333-8333-333333333333',
  roleId: '44444444-4444-4444-8444-444444444444',
  roleKey: 'OWNER',
}

const payload = {
  name: 'Propuesta',
  prompt: 'sunset',
  tracks: [
    {
      libraryItemId: 'aaaaaaaa-aaaa-4aaa-8aaa-000000000001',
      transitionNote: null,
    },
  ],
}

describe('saveSessionBuilderPlaylistAction', () => {
  beforeEach(() => {
    resolveMock.mockReset()
    saveMock.mockReset()
    resolveMock.mockResolvedValue(context)
  })

  it('returns only playlistId on success', async () => {
    saveMock.mockResolvedValue({ playlistId: 'pl-1' })
    const result = await saveSessionBuilderPlaylistAction(payload)
    expect(result).toEqual({ ok: true, playlistId: 'pl-1' })
    expect(saveMock).toHaveBeenCalledWith(context, payload)
    expect(JSON.stringify(result)).not.toContain('organizationId')
  })

  it('maps VIEWER/forbidden and stale safely', async () => {
    saveMock.mockRejectedValueOnce(
      new DjStudioError(DJ_STUDIO_ERROR_CODES.FORBIDDEN),
    )
    expect(await saveSessionBuilderPlaylistAction(payload)).toEqual({
      ok: false,
      error: SESSION_BUILDER_SAVE_PRODUCT_ERRORS.FORBIDDEN,
    })

    saveMock.mockRejectedValueOnce(
      new DjStudioError(DJ_STUDIO_ERROR_CODES.SESSION_BUILDER_STALE_DRAFT),
    )
    expect(await saveSessionBuilderPlaylistAction(payload)).toEqual({
      ok: false,
      error: SESSION_BUILDER_SAVE_PRODUCT_ERRORS.STALE,
    })

    saveMock.mockRejectedValueOnce(new Error('db boom'))
    expect(await saveSessionBuilderPlaylistAction(payload)).toEqual({
      ok: false,
      error: SESSION_BUILDER_SAVE_PRODUCT_ERRORS.GENERIC,
    })
  })
})
