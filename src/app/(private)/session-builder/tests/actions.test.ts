import { beforeEach, describe, expect, it, vi } from 'vitest'

import { generateSessionBuilderAction } from '@/app/(private)/session-builder/actions'
import { SESSION_BUILDER_PRODUCT_ERRORS } from '@/app/(private)/session-builder/map-error'
import type { ActiveOrganizationContext } from '@/domains/dj-studio/organization/types'
import {
  DJ_STUDIO_ERROR_CODES,
  DjStudioError,
} from '@/domains/dj-studio/shared/errors'
import {
  PLAYLIST_GENERATION_PROVIDER_ERROR_CODES,
  PlaylistGenerationProviderError,
  type PlaylistGenerationProvider,
} from '@/domains/dj-studio/session-builder/provider'
import type { SessionBuilderDraft } from '@/domains/dj-studio/session-builder/generation'

vi.mock('@/domains/dj-studio/organization/resolve-active-organization', () => ({
  resolveActiveOrganization: vi.fn(),
}))

vi.mock(
  '@/domains/dj-studio/session-builder/services/generate-session-proposal',
  () => ({
    generateSessionProposal: vi.fn(),
  }),
)

import { resolveActiveOrganization } from '@/domains/dj-studio/organization/resolve-active-organization'
import { generateSessionProposal } from '@/domains/dj-studio/session-builder/services/generate-session-proposal'

const resolveMock = vi.mocked(resolveActiveOrganization)
const generateMock = vi.mocked(generateSessionProposal)

const context: ActiveOrganizationContext = {
  profileId: '11111111-1111-4111-8111-111111111111',
  organizationId: '22222222-2222-4222-8222-222222222222',
  membershipId: '33333333-3333-4333-8333-333333333333',
  roleId: '44444444-4444-4444-8444-444444444444',
  roleKey: 'OWNER',
}

function form(): FormData {
  const data = new FormData()
  data.set('prompt', 'sunset afro house')
  data.set('targetDurationMin', '90')
  data.set('energyCurve', 'gradual_rise')
  data.set('bpmStart', '118')
  data.set('bpmEnd', '123')
  return data
}

const sampleDraft: SessionBuilderDraft = {
  title: 'Propuesta de sesión',
  summary: 'Resumen',
  targetDurationMin: 90,
  estimatedDurationMs: 1_000_000,
  estimatedDurationMode: 'exact',
  bpmProgression: {
    start: 118,
    end: 123,
    classification: 'ascending',
    notes: null,
  },
  energyProgression: 'Curva solicitada: gradual_rise',
  tracks: [],
  warnings: [],
}

describe('generateSessionBuilderAction', () => {
  beforeEach(() => {
    resolveMock.mockReset()
    generateMock.mockReset()
    resolveMock.mockResolvedValue(context)
  })

  it('returns draft on success with injected provider', async () => {
    generateMock.mockResolvedValue(sampleDraft)
    const provider: PlaylistGenerationProvider = {
      generate: vi.fn(async () => ({})),
    }

    const result = await generateSessionBuilderAction(form(), { provider })

    expect(result).toEqual({ ok: true, draft: sampleDraft })
    expect(generateMock).toHaveBeenCalledTimes(1)
    expect(generateMock.mock.calls[0][0].provider).toBe(provider)
    expect(generateMock.mock.calls[0][0].input).toMatchObject({
      source: 'library_only',
      targetDurationMin: 90,
    })
  })

  it('maps VIEWER/forbidden to safe Product error', async () => {
    generateMock.mockRejectedValue(
      new DjStudioError(DJ_STUDIO_ERROR_CODES.FORBIDDEN),
    )

    const result = await generateSessionBuilderAction(form())
    expect(result).toEqual({
      ok: false,
      error: SESSION_BUILDER_PRODUCT_ERRORS.FORBIDDEN,
    })
  })

  it('maps invalid input and provider failures safely', async () => {
    generateMock.mockRejectedValueOnce(
      new DjStudioError(DJ_STUDIO_ERROR_CODES.VALIDATION_ERROR),
    )
    expect(await generateSessionBuilderAction(form())).toEqual({
      ok: false,
      error: SESSION_BUILDER_PRODUCT_ERRORS.VALIDATION,
    })

    generateMock.mockRejectedValueOnce(
      new PlaylistGenerationProviderError(
        PLAYLIST_GENERATION_PROVIDER_ERROR_CODES.PROVIDER_TIMEOUT,
      ),
    )
    expect(await generateSessionBuilderAction(form())).toEqual({
      ok: false,
      error: SESSION_BUILDER_PRODUCT_ERRORS.PROVIDER_TIMEOUT,
    })

    generateMock.mockRejectedValueOnce(
      new PlaylistGenerationProviderError(
        PLAYLIST_GENERATION_PROVIDER_ERROR_CODES.INVALID_PROVIDER_PROPOSAL,
      ),
    )
    const invalid = await generateSessionBuilderAction(form())
    expect(invalid).toEqual({
      ok: false,
      error: SESSION_BUILDER_PRODUCT_ERRORS.INVALID_PROPOSAL,
    })
    expect(JSON.stringify(invalid)).not.toContain('stack')
  })
})
