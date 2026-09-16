import { expect, vi, type Mock } from 'vitest'

import {
  APIError,
  AuthenticationError,
  InternalServerError,
  PermissionDeniedError,
  RateLimitError,
} from 'openai'

import type { PlaylistGenerationRequest } from '@/domains/dj-studio/session-builder/provider/provider-types'
import { createMockCandidate } from '@/lib/ai/providers/mock-playlist-generation-provider'
import {
  OpenAiPlaylistGenerationProvider,
  type OpenAiPlaylistGenerationSleep,
} from '@/lib/ai/providers/openai-playlist-generation-provider'

export const TEST_SECRET = 'sk-test-THIS-MUST-NEVER-LEAK'
export const REQUEST_ID = 'req_must_never_surface'

export function buildRequest(
  overrides: Partial<PlaylistGenerationRequest> = {},
): PlaylistGenerationRequest {
  return {
    prompt: 'sunset afro house gradual rise',
    targetDurationMin: 90,
    energyCurve: 'gradual_rise',
    trackCountHint: 4,
    bpm: { start: 118, end: 123 },
    candidates: [
      createMockCandidate({
        libraryItemId: 'aaaaaaaa-aaaa-4aaa-8aaa-000000000001',
        title: 'Track One',
        candidateScore: 90,
      }),
      createMockCandidate({
        libraryItemId: 'aaaaaaaa-aaaa-4aaa-8aaa-000000000002',
        title: 'Track Two',
        candidateScore: 80,
      }),
    ],
    ...overrides,
  }
}

export function buildValidParsedOutput(
  request: PlaylistGenerationRequest,
  trackOverrides?: Array<Record<string, unknown>>,
) {
  const tracks =
    trackOverrides ??
    request.candidates.slice(0, 2).map((candidate, index) => ({
      libraryItemId: candidate.libraryItemId,
      position: index,
      transitionNote: index === 0 ? null : 'Blend in',
      reason: 'Fits the energy curve',
    }))

  return {
    title: 'AI session',
    summary: 'Structured proposal',
    tracks,
    energyProgression: 'gradual rise',
    bpmProgression: {
      start: 118,
      end: 123,
      notes: null,
    },
    warnings: [],
  }
}

export function buildSuccessResponse(outputParsed: unknown) {
  return {
    output_parsed: outputParsed,
    output: [],
    status: 'completed' as const,
    incomplete_details: null,
  }
}

export function createApiHeaders(
  init?: Record<string, string>,
): Headers {
  const headers = new Headers(init)
  if (!headers.has('x-request-id')) {
    headers.set('x-request-id', REQUEST_ID)
  }
  return headers
}

export function createAuthenticationError(
  overrides: {
    message?: string
    code?: string
    body?: Record<string, unknown>
    headers?: Headers
  } = {},
): AuthenticationError {
  return new AuthenticationError(
    401,
    {
      message: overrides.message ?? 'Invalid API key',
      code: overrides.code ?? 'invalid_api_key',
      secretInternal: TEST_SECRET,
      ...overrides.body,
    },
    overrides.message ?? 'Unauthorized',
    overrides.headers ?? createApiHeaders(),
  )
}

export function createPermissionDeniedError(): PermissionDeniedError {
  return new PermissionDeniedError(
    403,
    {
      message: 'Project denied',
      code: 'permission_denied',
      secretInternal: TEST_SECRET,
    },
    'Forbidden',
    createApiHeaders(),
  )
}

export function createRateLimitError(options: {
  code: string | null
  retryAfter?: string
  message?: string
}): RateLimitError {
  const headers = createApiHeaders()
  if (options.retryAfter !== undefined) {
    headers.set('retry-after', options.retryAfter)
  }

  return new RateLimitError(
    429,
    {
      message: options.message ?? 'Rate limited',
      code: options.code,
      secretInternal: TEST_SECRET,
    },
    options.message ?? 'Too Many Requests',
    headers,
  )
}

export function createInternalServerError(
  status: 500 | 503,
  options: { retryAfter?: string } = {},
): InternalServerError {
  const headers = createApiHeaders()
  if (options.retryAfter !== undefined) {
    headers.set('retry-after', options.retryAfter)
  }

  return new InternalServerError(
    status,
    {
      message: `Server ${status}`,
      secretInternal: TEST_SECRET,
    },
    `HTTP ${status}`,
    headers,
  )
}

export function createGenericApiError(status: number): APIError {
  return APIError.generate(
    status,
    {
      error: {
        message: `status ${status}`,
        secretInternal: TEST_SECRET,
      },
    },
    undefined,
    createApiHeaders(),
  )
}

export function assertNoSecretLeak(error: unknown): void {
  const serialized = JSON.stringify(error, Object.getOwnPropertyNames(error))
  expect(serialized).not.toContain(TEST_SECRET)
  expect(serialized).not.toContain(REQUEST_ID)

  if (error instanceof Error) {
    expect(error.message).not.toContain(TEST_SECRET)
    expect(error.message).not.toContain(REQUEST_ID)
  }

  if (
    error &&
    typeof error === 'object' &&
    'details' in error &&
    error.details !== undefined
  ) {
    expect(JSON.stringify(error.details)).not.toContain(TEST_SECRET)
    expect(JSON.stringify(error.details)).not.toContain(REQUEST_ID)
  }
}

export function assertRequestOptions(parse: Mock): void {
  for (const call of parse.mock.calls) {
    expect(call[1]).toEqual({
      timeout: 45_000,
      maxRetries: 0,
    })
  }
}

export function createProvider(options: {
  parse: Mock
  sleep?: OpenAiPlaylistGenerationSleep
  model?: string
}) {
  const sleep = options.sleep ?? vi.fn(async () => undefined)
  const provider = new OpenAiPlaylistGenerationProvider({
    client: { responses: { parse: options.parse } },
    model: options.model ?? 'test-model-snapshot',
    sleep,
  })
  return { provider, sleep }
}
