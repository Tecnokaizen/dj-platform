import { describe, expect, it } from 'vitest'

import {
  DJ_STUDIO_PERMISSION_DEFINITIONS,
  DJ_STUDIO_PERMISSION_KEYS,
} from '@/domains/dj-studio/permissions'

describe('DJ Studio Domain P0 permission keys', () => {
  it('exposes exactly the approved P0 keys', () => {
    expect(Object.values(DJ_STUDIO_PERMISSION_KEYS).sort()).toEqual(
      [
        'library.manage',
        'library.read',
        'playlists.manage',
        'playlists.read',
      ].sort()
    )
  })

  it('keeps definitions owned by DJ Studio Domain and aligned with keys', () => {
    expect(DJ_STUDIO_PERMISSION_DEFINITIONS).toHaveLength(4)
    for (const definition of DJ_STUDIO_PERMISSION_DEFINITIONS) {
      expect(definition.owner).toBe('DJ Studio Domain')
      expect(Object.values(DJ_STUDIO_PERMISSION_KEYS)).toContain(definition.key)
    }
  })
})
