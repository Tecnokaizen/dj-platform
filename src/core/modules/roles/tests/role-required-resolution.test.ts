import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest'

import type { Role } from '@/generated/prisma/client'
import { SYSTEM_ROLE_KEYS } from '@/core/modules/roles/constants/system-role-keys'
import { SYSTEM_ROLE_METADATA } from '@/core/modules/roles/constants/system-role-metadata'
import {
  ROLE_ERROR_CODES,
  RoleError,
} from '@/core/modules/roles/errors/role-error'
import { assertRolesTestDatabase } from '@/core/modules/roles/tests/assert-test-database'

const CANONICAL_KEYS = SYSTEM_ROLE_METADATA.map((role) => role.key)

type CanonicalRoleSnapshot = Pick<
  Role,
  | 'id'
  | 'key'
  | 'name'
  | 'description'
  | 'isSystem'
  | 'sortOrder'
  | 'createdAt'
  | 'updatedAt'
>

let originalCanonicalRoles: CanonicalRoleSnapshot[] = []

async function getPrisma() {
  const { prisma } = await import('@/lib/prisma')
  return prisma
}

async function seedCatalog(): Promise<void> {
  assertRolesTestDatabase()

  const prisma = await getPrisma()
  const { seedSystemRoles } = await import(
    '@/core/modules/roles/seed/seed-system-roles'
  )
  await seedSystemRoles(prisma)
}

async function loadCanonicalRoles(): Promise<CanonicalRoleSnapshot[]> {
  assertRolesTestDatabase()

  const prisma = await getPrisma()
  return prisma.role.findMany({
    where: {
      key: {
        in: [...CANONICAL_KEYS],
      },
    },
    orderBy: [{ sortOrder: 'asc' }, { key: 'asc' }],
    select: {
      id: true,
      key: true,
      name: true,
      description: true,
      isSystem: true,
      sortOrder: true,
      createdAt: true,
      updatedAt: true,
    },
  })
}

async function captureOriginalCanonicalRoles(): Promise<void> {
  assertRolesTestDatabase()
  originalCanonicalRoles = await loadCanonicalRoles()
}

async function restoreOriginalCanonicalRoles(): Promise<void> {
  assertRolesTestDatabase()

  const prisma = await getPrisma()

  await prisma.role.deleteMany({
    where: {
      key: {
        in: [...CANONICAL_KEYS],
      },
    },
  })

  for (const role of originalCanonicalRoles) {
    await prisma.role.create({
      data: {
        id: role.id,
        key: role.key,
        name: role.name,
        description: role.description,
        isSystem: role.isSystem,
        sortOrder: role.sortOrder,
        createdAt: role.createdAt,
        updatedAt: role.updatedAt,
      },
    })
  }
}

describe('Required Role resolution (R-027)', () => {
  beforeAll(async () => {
    assertRolesTestDatabase()
    await captureOriginalCanonicalRoles()
  })

  afterEach(async () => {
    await restoreOriginalCanonicalRoles()
  })

  afterAll(async () => {
    await restoreOriginalCanonicalRoles()
    expect(await loadCanonicalRoles()).toEqual(originalCanonicalRoles)
  })

  it('returns OWNER successfully when the Role exists', async () => {
    await seedCatalog()

    const { resolveRequiredRole } = await import(
      '@/core/modules/roles/services/resolve-required-role'
    )

    const role = await resolveRequiredRole(SYSTEM_ROLE_KEYS.OWNER)

    expect(role.key).toBe(SYSTEM_ROLE_KEYS.OWNER)
    expect(role.isSystem).toBe(true)
  })

  it('fails with REQUIRED_ROLE_MISSING and does not auto-create OWNER', async () => {
    const prisma = await getPrisma()

    await seedCatalog()

    await prisma.role.delete({
      where: { key: SYSTEM_ROLE_KEYS.OWNER },
    })

    const { resolveRequiredRole } = await import(
      '@/core/modules/roles/services/resolve-required-role'
    )

    try {
      await resolveRequiredRole(SYSTEM_ROLE_KEYS.OWNER)
      expect.unreachable('Expected REQUIRED_ROLE_MISSING')
    } catch (error) {
      expect(error).toBeInstanceOf(RoleError)
      expect((error as RoleError).code).toBe(ROLE_ERROR_CODES.REQUIRED_MISSING)
    }

    const { findRoleByKey } = await import(
      '@/core/modules/roles/services/find-role-by-key'
    )

    expect(await findRoleByKey(SYSTEM_ROLE_KEYS.OWNER)).toBeNull()
  })
})
