import { describe, expect, it } from 'vitest'

import {
  DEFAULT_RETRY_FALLBACK_MS,
  MAX_RETRY_DELAY_MS,
  resolveRetryDelayMs,
} from '@/lib/ai/providers/openai-retry-delay'

describe('resolveRetryDelayMs', () => {
  it('uses fallback when Retry-After is absent', () => {
    expect(resolveRetryDelayMs(new Headers())).toBe(DEFAULT_RETRY_FALLBACK_MS)
    expect(resolveRetryDelayMs(undefined)).toBe(DEFAULT_RETRY_FALLBACK_MS)
  })

  it('parses Retry-After seconds', () => {
    expect(
      resolveRetryDelayMs(new Headers({ 'retry-after': '2' })),
    ).toBe(2_000)
  })

  it('ceils fractional Retry-After seconds', () => {
    expect(
      resolveRetryDelayMs(new Headers({ 'retry-after': '0.25' })),
    ).toBe(250)
  })

  it('parses Retry-After HTTP-date with deterministic nowMs', () => {
    const nowMs = Date.parse('Wed, 16 Sep 2026 18:00:00 GMT')
    const future = new Date(nowMs + 3_000).toUTCString()
    expect(
      resolveRetryDelayMs(new Headers({ 'retry-after': future }), { nowMs }),
    ).toBe(3_000)
  })

  it('caps Retry-After at MAX_RETRY_DELAY_MS', () => {
    expect(
      resolveRetryDelayMs(new Headers({ 'retry-after': '30' })),
    ).toBe(MAX_RETRY_DELAY_MS)
  })

  it('falls back on invalid Retry-After', () => {
    expect(
      resolveRetryDelayMs(new Headers({ 'retry-after': 'garbage' })),
    ).toBe(DEFAULT_RETRY_FALLBACK_MS)
  })

  it('clamps past HTTP-date to 0', () => {
    const nowMs = Date.parse('Wed, 16 Sep 2026 18:00:00 GMT')
    const past = new Date(nowMs - 5_000).toUTCString()
    expect(
      resolveRetryDelayMs(new Headers({ 'retry-after': past }), { nowMs }),
    ).toBe(0)
  })
})
