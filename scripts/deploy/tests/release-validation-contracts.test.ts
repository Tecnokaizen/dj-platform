import { describe, expect, it } from 'vitest'

import { PERMISSION_KEYS } from '@/core/modules/permissions/constants/permission-keys'
import { DJ_STUDIO_PERMISSION_KEYS } from '@/domains/dj-studio/permissions/permission-keys'
import { DJ_STUDIO_SYSTEM_ROLE_PERMISSION_POLICY } from '@/domains/dj-studio/permissions/system-role-permission-policy'
import { SYSTEM_ROLE_KEYS } from '@/core/modules/roles/constants/system-role-keys'

describe('release validation contracts', () => {
  it('Core permission catalog has exactly 12 keys', () => {
    expect(Object.values(PERMISSION_KEYS)).toHaveLength(12)
  })

  it('DJ Studio permission catalog has exactly 4 keys', () => {
    expect(Object.values(DJ_STUDIO_PERMISSION_KEYS)).toHaveLength(4)
  })

  it('VIEWER Domain policy is read-only', () => {
    const viewer = DJ_STUDIO_SYSTEM_ROLE_PERMISSION_POLICY[SYSTEM_ROLE_KEYS.VIEWER]
    expect(viewer).toEqual([
      DJ_STUDIO_PERMISSION_KEYS.LIBRARY_READ,
      DJ_STUDIO_PERMISSION_KEYS.PLAYLISTS_READ,
    ])
    expect(viewer).not.toContain(DJ_STUDIO_PERMISSION_KEYS.LIBRARY_MANAGE)
    expect(viewer).not.toContain(DJ_STUDIO_PERMISSION_KEYS.PLAYLISTS_MANAGE)
  })

  it('OWNER Domain policy includes manage keys', () => {
    const owner = DJ_STUDIO_SYSTEM_ROLE_PERMISSION_POLICY[SYSTEM_ROLE_KEYS.OWNER]
    expect(owner).toContain(DJ_STUDIO_PERMISSION_KEYS.LIBRARY_MANAGE)
    expect(owner).toContain(DJ_STUDIO_PERMISSION_KEYS.PLAYLISTS_MANAGE)
    expect(owner).toHaveLength(4)
  })
})
