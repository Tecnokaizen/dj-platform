import 'server-only'

import OpenAI from 'openai'

import type { PlaylistGenerationProvider } from '@/domains/dj-studio/session-builder/provider/playlist-generation-provider'
import type { SessionBuilderProviderConfig } from '@/lib/ai/config/session-builder-provider-config'
import { MockPlaylistGenerationProvider } from '@/lib/ai/providers/mock-playlist-generation-provider'
import {
  OpenAiPlaylistGenerationProvider,
  type OpenAiResponsesClient,
} from '@/lib/ai/providers/openai-playlist-generation-provider'

export type OpenAiClientFactory = (apiKey: string) => OpenAiResponsesClient

const defaultOpenAiClientFactory: OpenAiClientFactory = (apiKey) =>
  new OpenAI({
    apiKey,
    maxRetries: 0,
  })

export type CreatePlaylistGenerationProviderOptions = {
  openAiClientFactory?: OpenAiClientFactory
}

/**
 * Build a PlaylistGenerationProvider from resolved config.
 * OpenAI client is constructed only when provider === 'openai'.
 */
export function createPlaylistGenerationProvider(
  config: SessionBuilderProviderConfig,
  options: CreatePlaylistGenerationProviderOptions = {},
): PlaylistGenerationProvider {
  if (config.provider === 'mock') {
    return new MockPlaylistGenerationProvider()
  }

  const openAiClientFactory =
    options.openAiClientFactory ?? defaultOpenAiClientFactory
  const client = openAiClientFactory(config.apiKey)

  return new OpenAiPlaylistGenerationProvider({
    client,
    model: config.model,
  })
}
