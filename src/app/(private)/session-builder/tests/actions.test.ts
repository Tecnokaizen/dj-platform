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

vi.mock('@/lib/ai/config/session-builder-provider-config', () => ({
  getSessionBuilderProviderConfig: vi.fn(),
}))

vi.mock('@/lib/ai/playlist-generation-provider-factory', () => ({
  createPlaylistGenerationProvider: vi.fn(),
}))

import { resolveActiveOrganization } from '@/domains/dj-studio/organization/resolve-active-organization'
import { generateSessionProposal } from '@/domains/dj-studio/session-builder/services/generate-session-proposal'
import { getSessionBuilderProviderConfig } from '@/lib/ai/config/session-builder-provider-config'
import { createPlaylistGenerationProvider } from '@/lib/ai/playlist-generation-provider-factory'

const resolveMock = vi.mocked(resolveActiveOrganization)
const generateMock = vi.mocked(generateSessionProposal)
const configMock = vi.mocked(getSessionBuilderProviderConfig)
const factoryMock = vi.mocked(createPlaylistGenerationProvider)

const context: ActiveOrganizationContext = {
  profileId: '11111111-1111-4111-8111-111111111111',
  organizationId: '22222222-2222-4222-8222-222222222222',
  membershipId: '33333333-3333-4333-8333-333333333333',
  roleId: '44444444-4444-4444-8444-444444444444',
  roleKey: 'OWNER',
}

const SECRET = 'sk-test-P4-MUST-NOT-LEAK'

function form(extra?: Record<string, string>): FormData {
  const data = new FormData()
  data.set('prompt', 'sunset afro house')
  data.set('targetDurationMin', '90')
  data.set('energyCurve', 'gradual_rise')
  data.set('bpmStart', '118')
  data.set('bpmEnd', '123')
  if (extra) {
    for (const [key, value] of Object.entries(extra)) {
      data.set(key, value)
    }
  }
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

describe('generateSessionBuilderAction (P4)', () => {
  const fakeProvider: PlaylistGenerationProvider = {
    generate: vi.fn(async () => ({})),
  }

  beforeEach(() => {
    resolveMock.mockReset()
    generateMock.mockReset()
    configMock.mockReset()
    factoryMock.mockReset()
    resolveMock.mockResolvedValue(context)
    configMock.mockReturnValue({ provider: 'mock' })
    factoryMock.mockReturnValue(fakeProvider)
    generateMock.mockResolvedValue(sampleDraft)
  })

  it('composes default mock config through factory into Domain', async () => {
    const result = await generateSessionBuilderAction(form())

    expect(result).toEqual({ ok: true, draft: sampleDraft })
    expect(configMock).toHaveBeenCalledTimes(1)
    expect(factoryMock).toHaveBeenCalledTimes(1)
    expect(factoryMock).toHaveBeenCalledWith({ provider: 'mock' })
    expect(generateMock).toHaveBeenCalledTimes(1)
    expect(generateMock.mock.calls[0][0].provider).toBe(fakeProvider)
    expect(generateMock.mock.calls[0][0].input).toMatchObject({
      source: 'library_only',
      targetDurationMin: 90,
    })
  })

  it('wires openai config through factory without leaking secrets', async () => {
    const openaiConfig = {
      provider: 'openai' as const,
      model: 'test-model',
      apiKey: SECRET,
    }
    configMock.mockReturnValue(openaiConfig)

    const result = await generateSessionBuilderAction(form())

    expect(result).toEqual({ ok: true, draft: sampleDraft })
    expect(factoryMock).toHaveBeenCalledWith(openaiConfig)
    expect(generateMock.mock.calls[0][0].provider).toBe(fakeProvider)
    expect(JSON.stringify(result)).not.toContain(SECRET)
    expect(JSON.stringify(result)).not.toContain('test-model')
    expect(JSON.stringify(result)).not.toContain('apiKey')
    expect(fakeProvider.generate).not.toHaveBeenCalled()
  })

  it('maps invalid provider config to unavailable without Mock fallback', async () => {
    configMock.mockImplementation(() => {
      throw new PlaylistGenerationProviderError(
        PLAYLIST_GENERATION_PROVIDER_ERROR_CODES.PROVIDER_UNAVAILABLE,
        'Session Builder provider configuration unavailable',
        { provider: 'unknown', category: 'configuration' },
      )
    })

    const result = await generateSessionBuilderAction(form())

    expect(result).toEqual({
      ok: false,
      error: SESSION_BUILDER_PRODUCT_ERRORS.PROVIDER_UNAVAILABLE,
    })
    expect(factoryMock).not.toHaveBeenCalled()
    expect(generateMock).not.toHaveBeenCalled()
  })

  it('ignores client FormData provider injection keys', async () => {
    await generateSessionBuilderAction(
      form({
        provider: 'openai',
        model: 'client-model',
        apiKey: SECRET,
        SESSION_BUILDER_PROVIDER: 'openai',
        OPENAI_API_KEY: SECRET,
      }),
    )

    expect(configMock).toHaveBeenCalledTimes(1)
    expect(factoryMock).toHaveBeenCalledWith({ provider: 'mock' })
    expect(JSON.stringify(generateMock.mock.calls[0][0].input)).not.toContain(
      SECRET,
    )
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
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.error).not.toBe(
        SESSION_BUILDER_PRODUCT_ERRORS.PROVIDER_UNAVAILABLE,
      )
    }
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

  it('exposes a single FormData public argument (no provider injection seam)', () => {
    expect(generateSessionBuilderAction.length).toBe(1)
  })
})
