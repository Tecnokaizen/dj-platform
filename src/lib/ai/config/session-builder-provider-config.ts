import 'server-only'

import {
  PLAYLIST_GENERATION_PROVIDER_ERROR_CODES,
  PlaylistGenerationProviderError,
} from '@/domains/dj-studio/session-builder/provider/provider-errors'

/**
 * Infrastructure default for Session Builder OpenAI model.
 * Lives in config — not Domain, not the OpenAI adapter.
 */
export const DEFAULT_SESSION_BUILDER_OPENAI_MODEL = 'gpt-5.6-terra'

export type SessionBuilderProviderConfig =
  | {
      provider: 'mock'
    }
  | {
      provider: 'openai'
      model: string
      apiKey: string
    }

type EnvironmentSource = Record<string, string | undefined>

function configurationUnavailable(
  provider: 'openai' | 'unknown',
): PlaylistGenerationProviderError {
  return new PlaylistGenerationProviderError(
    PLAYLIST_GENERATION_PROVIDER_ERROR_CODES.PROVIDER_UNAVAILABLE,
    'Session Builder provider configuration unavailable',
    {
      provider,
      category: 'configuration',
    },
  )
}

/**
 * Resolve Session Builder AI provider config from an env source.
 * Does not read process.env at module load — call this when constructing.
 */
export function getSessionBuilderProviderConfig(
  environment: EnvironmentSource = process.env,
): SessionBuilderProviderConfig {
  const rawProvider = environment.SESSION_BUILDER_PROVIDER

  if (rawProvider === undefined || rawProvider.trim() === '') {
    return { provider: 'mock' }
  }

  const provider = rawProvider.trim()

  if (provider === 'mock') {
    return { provider: 'mock' }
  }

  if (provider !== 'openai') {
    throw configurationUnavailable('unknown')
  }

  const rawApiKey = environment.OPENAI_API_KEY
  if (rawApiKey === undefined || rawApiKey.trim() === '') {
    throw configurationUnavailable('openai')
  }

  const rawModel = environment.SESSION_BUILDER_OPENAI_MODEL
  const model =
    rawModel !== undefined && rawModel.trim() !== ''
      ? rawModel.trim()
      : DEFAULT_SESSION_BUILDER_OPENAI_MODEL

  return {
    provider: 'openai',
    model,
    apiKey: rawApiKey.trim(),
  }
}
