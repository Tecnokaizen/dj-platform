import { readdir } from 'node:fs/promises'
import path from 'node:path'

import { describe, expect, it } from 'vitest'

import { PERMISSION_KEYS } from '@/core/modules/permissions/constants/permission-keys'
import { DJ_STUDIO_PERMISSION_KEYS } from '@/domains/dj-studio/permissions/permission-keys'
import { DJ_STUDIO_SYSTEM_ROLE_PERMISSION_POLICY } from '@/domains/dj-studio/permissions/system-role-permission-policy'
import { SYSTEM_ROLE_KEYS } from '@/core/modules/roles/constants/system-role-keys'
import {
  DJ_STUDIO_SUPABASE_M5_VERSION,
  DJ_STUDIO_SUPABASE_M6_VERSION,
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

  it('Product Supabase contract is Foundation S1–S7 + Domain M5–M6 (total 9)', async () => {
    expect(FOUNDATION_SUPABASE_MIGRATION_COUNT).toBe(7)
    expect(FOUNDATION_SUPABASE_S7_VERSION).toBe('20260914230000')
    expect(DJ_STUDIO_SUPABASE_MIGRATION_COUNT).toBe(2)
    expect(DJ_STUDIO_SUPABASE_M5_VERSION).toBe('20260913240000')
    expect(DJ_STUDIO_SUPABASE_M6_VERSION).toBe('20260915150000')
    expect(
      FOUNDATION_SUPABASE_MIGRATION_COUNT + DJ_STUDIO_SUPABASE_MIGRATION_COUNT,
    ).toBe(9)

    const foundationDir = path.join(process.cwd(), 'supabase/migrations')
    const foundationFiles = (await readdir(foundationDir)).filter((name) =>
      name.endsWith('.sql'),
    )
    expect(foundationFiles).toHaveLength(FOUNDATION_SUPABASE_MIGRATION_COUNT)
    expect(foundationFiles).toContain(
      `${FOUNDATION_SUPABASE_S7_VERSION}_profiles_authenticated_grants.sql`,
    )

    const domainDir = path.join(process.cwd(), 'supabase/migrations-dj-studio')
    const domainFiles = (await readdir(domainDir)).filter((name) =>
      name.endsWith('.sql'),
    )
    expect(domainFiles).toHaveLength(DJ_STUDIO_SUPABASE_MIGRATION_COUNT)
    expect(domainFiles).toContain(
      `${DJ_STUDIO_SUPABASE_M5_VERSION}_dj_studio_rls_and_runtime_grants.sql`,
    )
    expect(domainFiles).toContain(
      `${DJ_STUDIO_SUPABASE_M6_VERSION}_dj_studio_catalog_runtime_grants.sql`,
    )
  })
})
