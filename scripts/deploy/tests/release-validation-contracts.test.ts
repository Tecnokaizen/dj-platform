import { readdir } from 'node:fs/promises'
import path from 'node:path'

import { describe, expect, it } from 'vitest'

import { PERMISSION_KEYS } from '@/core/modules/permissions/constants/permission-keys'
import { DJ_STUDIO_PERMISSION_KEYS } from '@/domains/dj-studio/permissions/permission-keys'
import { DJ_STUDIO_SYSTEM_ROLE_PERMISSION_POLICY } from '@/domains/dj-studio/permissions/system-role-permission-policy'
import { SYSTEM_ROLE_KEYS } from '@/core/modules/roles/constants/system-role-keys'
import {
  DJ_STUDIO_SUPABASE_MIGRATION_COUNT,
  FOUNDATION_SUPABASE_MIGRATION_COUNT,
  FOUNDATION_SUPABASE_S7_VERSION,
} from '../validate-database'

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

  it('Foundation Supabase contract is S1–S7 (floor 7) including profiles grants S7', async () => {
    expect(FOUNDATION_SUPABASE_MIGRATION_COUNT).toBe(7)
    expect(FOUNDATION_SUPABASE_S7_VERSION).toBe('20260914230000')
    expect(DJ_STUDIO_SUPABASE_MIGRATION_COUNT).toBe(1)
    expect(
      FOUNDATION_SUPABASE_MIGRATION_COUNT + DJ_STUDIO_SUPABASE_MIGRATION_COUNT,
    ).toBe(8)

    const foundationDir = path.join(process.cwd(), 'supabase/migrations')
    const files = (await readdir(foundationDir)).filter((name) =>
      name.endsWith('.sql'),
    )
    expect(files).toHaveLength(FOUNDATION_SUPABASE_MIGRATION_COUNT)
    expect(files).toContain(
      `${FOUNDATION_SUPABASE_S7_VERSION}_profiles_authenticated_grants.sql`,
    )
  })
})
