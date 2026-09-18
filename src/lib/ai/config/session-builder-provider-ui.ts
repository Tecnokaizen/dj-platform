import 'server-only'

import { getSessionBuilderProviderConfig } from '@/lib/ai/config/session-builder-provider-config'

export type SessionBuilderProviderUiKind = 'mock' | 'openai' | 'unavailable'

export type SessionBuilderProviderUiState = {
  kind: SessionBuilderProviderUiKind
}

export const SESSION_BUILDER_PROVIDER_LABELS = {
  mock: 'Generador en modo de prueba',
  openai: 'Generador IA',
  unavailable: 'Generador no disponible',
} as const

/**
 * Public, secret-free provider presentation for Session Builder UI.
 * Never returns apiKey, model, env names, or raw config.
 */
export function getSessionBuilderProviderUiState(
  environment: Record<string, string | undefined> = process.env,
): SessionBuilderProviderUiState {
  try {
    const config = getSessionBuilderProviderConfig(environment)
    return { kind: config.provider }
  } catch {
    return { kind: 'unavailable' }
  }
}

export function getSessionBuilderProviderLabel(
  kind: SessionBuilderProviderUiKind,
): string {
  return SESSION_BUILDER_PROVIDER_LABELS[kind]
}
