export const PLAYLIST_GENERATION_PROVIDER_ERROR_CODES = {
  PROVIDER_UNAVAILABLE: 'PROVIDER_UNAVAILABLE',
  PROVIDER_TIMEOUT: 'PROVIDER_TIMEOUT',
  INVALID_PROVIDER_RESPONSE: 'INVALID_PROVIDER_RESPONSE',
  INVALID_PROVIDER_PROPOSAL: 'INVALID_PROVIDER_PROPOSAL',
  EMPTY_PROVIDER_PROPOSAL: 'EMPTY_PROVIDER_PROPOSAL',
} as const

export type PlaylistGenerationProviderErrorCode =
  (typeof PLAYLIST_GENERATION_PROVIDER_ERROR_CODES)[keyof typeof PLAYLIST_GENERATION_PROVIDER_ERROR_CODES]

export class PlaylistGenerationProviderError extends Error {
  readonly code: PlaylistGenerationProviderErrorCode
  readonly details?: Readonly<Record<string, unknown>>

  constructor(
    code: PlaylistGenerationProviderErrorCode,
    message?: string,
    details?: Readonly<Record<string, unknown>>,
  ) {
    super(message ?? code)
    this.name = 'PlaylistGenerationProviderError'
    this.code = code
    this.details = details
  }
}
