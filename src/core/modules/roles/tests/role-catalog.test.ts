import { beforeAll, describe, expect, it } from 'vitest'

import { SYSTEM_ROLE_METADATA } from '@/core/modules/roles/constants/system-role-metadata'
import { assertRolesTestDatabase } from '@/core/modules/roles/tests/assert-test-database'

describe('Canonical Role catalog (R-025)', () => {
  beforeAll(async () => {
    assertRolesTestDatabase()

    const { prisma } = await import('@/lib/prisma')
    const { seedSystemRoles } = await import(
      '@/core/modules/roles/seed/seed-system-roles'
    )

    await seedSystemRoles(prisma)
  })

  it('resolves every required canonical Role by key', async () => {
    const { resolveRequiredRole } = await import(
      '@/core/modules/roles/services/resolve-required-role'
    )

    for (const expected of SYSTEM_ROLE_METADATA) {
      const role = await resolveRequiredRole(expected.key)

      expect(role.key).toBe(expected.key)
      expect(role.isSystem).toBe(true)
    }
  })

  it('finds every canonical Role via persistence lookup', async () => {
    const { findRoleByKey } = await import(
      '@/core/modules/roles/services/find-role-by-key'
    )

    for (const expected of SYSTEM_ROLE_METADATA) {
      const role = await findRoleByKey(expected.key)

      expect(role).not.toBeNull()
      expect(role?.key).toBe(expected.key)
      expect(role?.isSystem).toBe(true)
    }
  })

  it('passes system Role catalog validation', async () => {
    const { validateSystemRoleCatalog } = await import(
      '@/core/modules/roles/services/validate-system-role-catalog'
    )

    await expect(validateSystemRoleCatalog()).resolves.toBeUndefined()
  })
})
