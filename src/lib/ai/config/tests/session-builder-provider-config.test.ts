import { describe, expect, it, vi } from 'vitest'

import {
  PLAYLIST_GENERATION_PROVIDER_ERROR_CODES,
  PlaylistGenerationProviderError,
} from '@/domains/dj-studio/session-builder/provider/provider-errors'
import {
  DEFAULT_SESSION_BUILDER_OPENAI_MODEL,
  getSessionBuilderProviderConfig,
} from '@/lib/ai/config/session-builder-provider-config'
import { createPlaylistGenerationProvider } from '@/lib/ai/playlist-generation-provider-factory'
import { MockPlaylistGenerationProvider } from '@/lib/ai/providers/mock-playlist-generation-provider'
import { OpenAiPlaylistGenerationProvider } from '@/lib/ai/providers/openai-playlist-generation-provider'

const SECRET = 'super-secret-test-key'

describe('getSessionBuilderProviderConfig', () => {
  it('defaults to mock when AI env is absent', () => {
    expect(getSessionBuilderProviderConfig({})).toEqual({ provider: 'mock' })
  })

  it('accepts explicit mock without API key', () => {
    expect(
      getSessionBuilderProviderConfig({
        SESSION_BUILDER_PROVIDER: 'mock',
      }),
    ).toEqual({ provider: 'mock' })
  })

  it('rejects invalid provider strings without silent mock fallback', () => {
    expect(() =>
      getSessionBuilderProviderConfig({
        SESSION_BUILDER_PROVIDER: 'opneai',
      }),
    ).toThrow(PlaylistGenerationProviderError)

    try {
      getSessionBuilderProviderConfig({
        SESSION_BUILDER_PROVIDER: 'opneai',
      })
    } catch (error) {
      expect(error).toBeInstanceOf(PlaylistGenerationProviderError)
      const providerError = error as PlaylistGenerationProviderError
      expect(providerError.code).toBe(
        PLAYLIST_GENERATION_PROVIDER_ERROR_CODES.PROVIDER_UNAVAILABLE,
      )
      expect(providerError.details).toEqual({
        provider: 'unknown',
        category: 'configuration',
      })
    }
  })

  it('rejects openai without OPENAI_API_KEY', () => {
    expect(() =>
      getSessionBuilderProviderConfig({
        SESSION_BUILDER_PROVIDER: 'openai',
      }),
    ).toThrow(PlaylistGenerationProviderError)

    try {
      getSessionBuilderProviderConfig({
        SESSION_BUILDER_PROVIDER: 'openai',
      })
    } catch (error) {
      const providerError = error as PlaylistGenerationProviderError
      expect(providerError.code).toBe(
        PLAYLIST_GENERATION_PROVIDER_ERROR_CODES.PROVIDER_UNAVAILABLE,
      )
      expect(providerError.details).toEqual({
        provider: 'openai',
        category: 'configuration',
      })
    }
  })

  it('rejects whitespace-only OPENAI_API_KEY', () => {
    expect(() =>
      getSessionBuilderProviderConfig({
        SESSION_BUILDER_PROVIDER: 'openai',
        OPENAI_API_KEY: '   ',
      }),
    ).toThrow(PlaylistGenerationProviderError)
  })

  it('uses default model when openai key is set and model is absent', () => {
    expect(
      getSessionBuilderProviderConfig({
        SESSION_BUILDER_PROVIDER: 'openai',
        OPENAI_API_KEY: SECRET,
      }),
    ).toEqual({
      provider: 'openai',
      model: DEFAULT_SESSION_BUILDER_OPENAI_MODEL,
      apiKey: SECRET,
    })
    expect(DEFAULT_SESSION_BUILDER_OPENAI_MODEL).toBe('gpt-5.6-terra')
  })

  it('preserves a custom non-empty model', () => {
    expect(
      getSessionBuilderProviderConfig({
        SESSION_BUILDER_PROVIDER: 'openai',
        OPENAI_API_KEY: SECRET,
        SESSION_BUILDER_OPENAI_MODEL: 'custom-model-snapshot',
      }),
    ).toEqual({
      provider: 'openai',
      model: 'custom-model-snapshot',
      apiKey: SECRET,
    })
  })

  it('never includes the API key in error message or details', () => {
    try {
      getSessionBuilderProviderConfig({
        SESSION_BUILDER_PROVIDER: 'opneai',
        OPENAI_API_KEY: SECRET,
      })
      throw new Error('expected configuration failure')
    } catch (error) {
      expect(error).toBeInstanceOf(PlaylistGenerationProviderError)
      const providerError = error as PlaylistGenerationProviderError
      expect(providerError.message).not.toContain(SECRET)
      expect(JSON.stringify(providerError)).not.toContain(SECRET)
      expect(JSON.stringify(providerError.details)).not.toContain(SECRET)
      expect(providerError.details).toEqual({
        provider: 'unknown',
        category: 'configuration',
      })
    }
  })
})

describe('createPlaylistGenerationProvider', () => {
  it('builds Mock without calling OpenAI client factory', () => {
    const openAiClientFactory = vi.fn()
    const provider = createPlaylistGenerationProvider(
      { provider: 'mock' },
      { openAiClientFactory },
    )

    expect(provider).toBeInstanceOf(MockPlaylistGenerationProvider)
    expect(openAiClientFactory).not.toHaveBeenCalled()
  })

  it('builds OpenAI provider lazily via injected client factory', () => {
    const client = {
      responses: {
        parse: vi.fn(),
      },
    }
    const openAiClientFactory = vi.fn().mockReturnValue(client)

    const provider = createPlaylistGenerationProvider(
      {
        provider: 'openai',
        model: 'gpt-5.6-terra',
        apiKey: SECRET,
      },
      { openAiClientFactory },
    )

    expect(provider).toBeInstanceOf(OpenAiPlaylistGenerationProvider)
    expect(openAiClientFactory).toHaveBeenCalledTimes(1)
    expect(openAiClientFactory).toHaveBeenCalledWith(SECRET)
    expect(client.responses.parse).not.toHaveBeenCalled()
  })

  it('does not leak API key from factory construction surfaces', () => {
    const openAiClientFactory = vi.fn().mockImplementation(() => {
      throw new PlaylistGenerationProviderError(
        PLAYLIST_GENERATION_PROVIDER_ERROR_CODES.PROVIDER_UNAVAILABLE,
        'Session Builder provider configuration unavailable',
        { provider: 'openai', category: 'configuration' },
      )
    })

    try {
      createPlaylistGenerationProvider(
        {
          provider: 'openai',
          model: 'gpt-5.6-terra',
          apiKey: SECRET,
        },
        { openAiClientFactory },
      )
      throw new Error('expected factory failure')
    } catch (error) {
      expect(error).toBeInstanceOf(PlaylistGenerationProviderError)
      const providerError = error as PlaylistGenerationProviderError
      expect(providerError.message).not.toContain(SECRET)
      expect(JSON.stringify(providerError)).not.toContain(SECRET)
      expect(JSON.stringify(providerError.details)).not.toContain(SECRET)
    }
  })
})
