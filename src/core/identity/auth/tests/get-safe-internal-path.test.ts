import { describe, expect, it } from 'vitest'

import { getSafeInternalPath } from '@/core/identity/auth/utils/get-safe-internal-path'

describe('getSafeInternalPath', () => {
  it('accepts simple internal paths', () => {
    expect(getSafeInternalPath('/dashboard')).toBe('/dashboard')
    expect(getSafeInternalPath('/profile')).toBe('/profile')
    expect(getSafeInternalPath('/orgs/acme?tab=members')).toBe(
      '/orgs/acme?tab=members'
    )
  })

  it('rejects protocol-relative and external targets', () => {
    expect(getSafeInternalPath('//attacker.example')).toBe('/dashboard')
    expect(getSafeInternalPath('https://attacker.example')).toBe('/dashboard')
    expect(getSafeInternalPath('http://attacker.example/path')).toBe(
      '/dashboard'
    )
    expect(getSafeInternalPath('/\\evil')).toBe('/dashboard')
    expect(getSafeInternalPath('\\evil')).toBe('/dashboard')
    expect(getSafeInternalPath('\\\\evil')).toBe('/dashboard')
  })

  it('rejects schemes, whitespace, and empty values', () => {
    expect(getSafeInternalPath('/path://evil')).toBe('/dashboard')
    expect(getSafeInternalPath('/has space')).toBe('/dashboard')
    expect(getSafeInternalPath('/has\tTab')).toBe('/dashboard')
    expect(getSafeInternalPath('')).toBe('/dashboard')
    expect(getSafeInternalPath(null)).toBe('/dashboard')
    expect(getSafeInternalPath(undefined)).toBe('/dashboard')
  })

  it('supports a custom fallback', () => {
    expect(getSafeInternalPath('//evil', '/profile')).toBe('/profile')
  })
})
