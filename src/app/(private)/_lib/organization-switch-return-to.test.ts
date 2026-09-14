import { describe, expect, it } from 'vitest'

import { getSafeInternalPath } from '@/core/identity/auth/utils/get-safe-internal-path'

/**
 * Contract for organization switch navigation only.
 * AuthZ remains in switchActiveOrganization (membership ACTIVE).
 * Full getSafeInternalPath edge cases live in Core identity tests.
 */
describe('organization switch returnTo sanitization', () => {
  const fallback = '/dashboard'

  it.each([
    ['/library', '/library'],
    ['/playlists', '/playlists'],
    ['/playlists/11111111-1111-1111-1111-111111111111', '/playlists/11111111-1111-1111-1111-111111111111'],
    ['/studio-profile', '/studio-profile'],
    ['/dashboard', '/dashboard'],
    ['https://evil.example', '/dashboard'],
    ['//evil.example/path', '/dashboard'],
    ['', '/dashboard'],
    [null, '/dashboard'],
  ] as const)('maps %j → %s', (raw, expected) => {
    expect(getSafeInternalPath(raw, fallback)).toBe(expected)
  })
})
