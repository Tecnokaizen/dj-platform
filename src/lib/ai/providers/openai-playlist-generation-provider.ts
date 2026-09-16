import 'server-only'

import {
  APIConnectionError,
  APIConnectionTimeoutError,
  APIError,
  AuthenticationError,
  InternalServerError,
  PermissionDeniedError,
  RateLimitError,
} from 'openai'
import {
  ContentFilterFinishReasonError,
  LengthFinishReasonError,
} from 'openai/error'
import type OpenAI from 'openai'
import { zodTextFormat } from 'openai/helpers/zod'
import type { ParsedResponse } from 'openai/resources/responses/responses'

import type { PlaylistGenerationProvider } from '@/domains/dj-studio/session-builder/provider/playlist-generation-provider'
import { playlistGenerationProviderOutputSchema } from '@/domains/dj-studio/session-builder/provider/proposal-schema'
import {
  PLAYLIST_GENERATION_PROVIDER_ERROR_CODES,
  PlaylistGenerationProviderError,
} from '@/domains/dj-studio/session-builder/provider/provider-errors'
import type { PlaylistGenerationRequest } from '@/domains/dj-studio/session-builder/provider/provider-types'
import {
  MAX_RETRY_DELAY_MS,
  resolveRetryDelayMs,
} from '@/lib/ai/providers/openai-retry-delay'
import {
  buildOpenAiSessionBuilderInput,
  buildOpenAiSessionBuilderInstructions,
} from '@/lib/ai/providers/openai-session-builder-prompt'

export const DEFAULT_TIMEOUT_MS = 45_000
export const DEFAULT_MAX_OUTPUT_TOKENS = 8_192
export const MAX_RETRY_ATTEMPTS = 1

const STRUCTURED_OUTPUT_NAME = 'dj_studio_session_proposal'

const RETRYABLE_RATE_LIMIT_CODES = new Set([
  'rate_limit_error',
  'slow_down',
])

const NON_RETRYABLE_RATE_LIMIT_CODES = new Set([
  'credit_balance_exhausted',
  'organization_spend_limit_exceeded',
  'project_spend_limit_exceeded',
  'organization_usage_limit_exceeded',
])

export type OpenAiResponsesClient = {
  responses: Pick<OpenAI['responses'], 'parse'>
}

export type OpenAiPlaylistGenerationSleep = (ms: number) => Promise<void>

export type OpenAiPlaylistGenerationProviderOptions = {
  client: OpenAiResponsesClient
  model: string
  timeoutMs?: number
  maxOutputTokens?: number
  sleep?: OpenAiPlaylistGenerationSleep
}

type SafeErrorCategory =
  | 'timeout'
  | 'auth'
  | 'permission'
  | 'rate_limit'
  | 'billing_limit'
  | 'server_error'
  | 'network'
  | 'refusal'
  | 'incomplete'
  | 'invalid_response'
  | 'unknown'

function defaultSleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms)
  })
}

function safeDetails(
  category: SafeErrorCategory,
): Readonly<Record<string, unknown>> {
  return {
    provider: 'openai',
    category,
  }
}

function responseContainsRefusal(
  response: ParsedResponse<unknown>,
): boolean {
  for (const item of response.output ?? []) {
    if (item.type !== 'message') {
      continue
    }

    for (const part of item.content ?? []) {
      if (part.type === 'refusal') {
        return true
      }
    }
  }

  return false
}

/**
 * SDK 7.16.0 `responses.parse` + `zodTextFormat` can throw:
 * - ZodError when `$parseRaw` / schema validation fails
 * - SyntaxError for invalid JSON structured output
 * - LengthFinishReasonError / ContentFilterFinishReasonError from `openai/error`
 *   (finish-reason helpers; treated as non-usable structured proposal)
 *
 * Avoid `instanceof ZodError` — Zod dual-package / bundler edges can make the
 * constructor non-object under Vitest. Name-based detection is stable.
 */
function isStructuredParseFailure(error: unknown): boolean {
  if (error instanceof SyntaxError) {
    return true
  }
  if (
    error instanceof LengthFinishReasonError ||
    error instanceof ContentFilterFinishReasonError
  ) {
    return true
  }
  return (
    typeof error === 'object' &&
    error !== null &&
    (error as { name?: string }).name === 'ZodError'
  )
}

function isRetryableUpstreamError(error: unknown): boolean {
  if (error instanceof RateLimitError) {
    const code = error.code ?? undefined
    if (code && NON_RETRYABLE_RATE_LIMIT_CODES.has(code)) {
      return false
    }
    return Boolean(code && RETRYABLE_RATE_LIMIT_CODES.has(code))
  }

  if (error instanceof InternalServerError) {
    return error.status === 500 || error.status === 503
  }

  if (error instanceof APIError) {
    return error.status === 500 || error.status === 503
  }

  return false
}

function mapUpstreamError(error: unknown): PlaylistGenerationProviderError {
  if (error instanceof PlaylistGenerationProviderError) {
    return error
  }

  if (error instanceof APIConnectionTimeoutError) {
    return new PlaylistGenerationProviderError(
      PLAYLIST_GENERATION_PROVIDER_ERROR_CODES.PROVIDER_TIMEOUT,
      'OpenAI provider timed out',
      safeDetails('timeout'),
    )
  }

  if (isStructuredParseFailure(error)) {
    return new PlaylistGenerationProviderError(
      PLAYLIST_GENERATION_PROVIDER_ERROR_CODES.INVALID_PROVIDER_RESPONSE,
      'OpenAI provider returned an invalid structured response',
      safeDetails('invalid_response'),
    )
  }

  if (error instanceof AuthenticationError) {
    return new PlaylistGenerationProviderError(
      PLAYLIST_GENERATION_PROVIDER_ERROR_CODES.PROVIDER_UNAVAILABLE,
      'OpenAI provider unavailable',
      safeDetails('auth'),
    )
  }

  if (error instanceof PermissionDeniedError) {
    return new PlaylistGenerationProviderError(
      PLAYLIST_GENERATION_PROVIDER_ERROR_CODES.PROVIDER_UNAVAILABLE,
      'OpenAI provider unavailable',
      safeDetails('permission'),
    )
  }

  if (error instanceof RateLimitError) {
    const code = error.code ?? undefined
    const category: SafeErrorCategory =
      code && NON_RETRYABLE_RATE_LIMIT_CODES.has(code)
        ? 'billing_limit'
        : 'rate_limit'

    return new PlaylistGenerationProviderError(
      PLAYLIST_GENERATION_PROVIDER_ERROR_CODES.PROVIDER_UNAVAILABLE,
      'OpenAI provider unavailable',
      safeDetails(category),
    )
  }

  if (error instanceof APIConnectionError) {
    return new PlaylistGenerationProviderError(
      PLAYLIST_GENERATION_PROVIDER_ERROR_CODES.PROVIDER_UNAVAILABLE,
      'OpenAI provider unavailable',
      safeDetails('network'),
    )
  }

  if (error instanceof InternalServerError || error instanceof APIError) {
    return new PlaylistGenerationProviderError(
      PLAYLIST_GENERATION_PROVIDER_ERROR_CODES.PROVIDER_UNAVAILABLE,
      'OpenAI provider unavailable',
      safeDetails('server_error'),
    )
  }

  return new PlaylistGenerationProviderError(
    PLAYLIST_GENERATION_PROVIDER_ERROR_CODES.PROVIDER_UNAVAILABLE,
    'OpenAI provider unavailable',
    safeDetails('unknown'),
  )
}

/**
 * Server-only OpenAI Responses adapter for PlaylistGenerationProvider.
 * Returns structurally parsed unknown; Domain parser remains mandatory.
 */
export class OpenAiPlaylistGenerationProvider
  implements PlaylistGenerationProvider
{
  private readonly client: OpenAiResponsesClient
  private readonly model: string
  private readonly timeoutMs: number
  private readonly maxOutputTokens: number
  private readonly sleep: OpenAiPlaylistGenerationSleep

  constructor(options: OpenAiPlaylistGenerationProviderOptions) {
    if (!options.model.trim()) {
      throw new Error('OpenAiPlaylistGenerationProvider requires a non-empty model')
    }

    if (options.timeoutMs !== undefined && options.timeoutMs <= 0) {
      throw new Error('OpenAiPlaylistGenerationProvider requires timeoutMs > 0')
    }

    if (
      options.maxOutputTokens !== undefined &&
      options.maxOutputTokens <= 0
    ) {
      throw new Error(
        'OpenAiPlaylistGenerationProvider requires maxOutputTokens > 0',
      )
    }

    this.client = options.client
    this.model = options.model
    this.timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS
    this.maxOutputTokens = options.maxOutputTokens ?? DEFAULT_MAX_OUTPUT_TOKENS
    this.sleep = options.sleep ?? defaultSleep
  }

  async generate(request: PlaylistGenerationRequest): Promise<unknown> {
    let attempt = 0

    while (true) {
      try {
        return await this.invokeOnce(request)
      } catch (error) {
        if (
          attempt < MAX_RETRY_ATTEMPTS &&
          isRetryableUpstreamError(error)
        ) {
          const headers =
            error instanceof APIError ? error.headers : undefined
          const delayMs = resolveRetryDelayMs(headers, {
            maxMs: MAX_RETRY_DELAY_MS,
          })
          attempt += 1
          try {
            await this.sleep(delayMs)
          } catch (sleepError) {
            throw mapUpstreamError(sleepError)
          }
          continue
        }

        throw mapUpstreamError(error)
      }
    }
  }

  private async invokeOnce(
    request: PlaylistGenerationRequest,
  ): Promise<unknown> {
    const response = await this.client.responses.parse(
      {
        model: this.model,
        store: false,
        max_output_tokens: this.maxOutputTokens,
        instructions: buildOpenAiSessionBuilderInstructions(),
        input: buildOpenAiSessionBuilderInput(request),
        text: {
          format: zodTextFormat(
            playlistGenerationProviderOutputSchema,
            STRUCTURED_OUTPUT_NAME,
          ),
        },
      },
      {
        timeout: this.timeoutMs,
        maxRetries: 0,
      },
    )

    return this.mapParsedResponse(response)
  }

  private mapParsedResponse(
    response: ParsedResponse<unknown>,
  ): unknown {
    if (response.output_parsed != null) {
      return response.output_parsed
    }

    if (responseContainsRefusal(response)) {
      throw new PlaylistGenerationProviderError(
        PLAYLIST_GENERATION_PROVIDER_ERROR_CODES.INVALID_PROVIDER_PROPOSAL,
        'OpenAI provider refused to produce a usable proposal',
        safeDetails('refusal'),
      )
    }

    if (
      response.status === 'incomplete' ||
      response.incomplete_details != null
    ) {
      throw new PlaylistGenerationProviderError(
        PLAYLIST_GENERATION_PROVIDER_ERROR_CODES.INVALID_PROVIDER_RESPONSE,
        'OpenAI provider returned an incomplete structured response',
        safeDetails('incomplete'),
      )
    }

    throw new PlaylistGenerationProviderError(
      PLAYLIST_GENERATION_PROVIDER_ERROR_CODES.INVALID_PROVIDER_RESPONSE,
      'OpenAI provider returned no structured proposal',
      safeDetails('invalid_response'),
    )
  }
}
