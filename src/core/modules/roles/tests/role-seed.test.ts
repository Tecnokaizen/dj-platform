import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest'

import type { Role } from '@/generated/prisma/client'
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
let originalCanonicalRolePermissions: Array<{
  id: string
  roleId: string
  permissionId: string
  createdAt: Date
}> = []

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
  const prisma = await getPrisma()
  originalCanonicalRolePermissions = await prisma.rolePermission.findMany({
    where: { roleId: { in: originalCanonicalRoles.map(({ id }) => id) } },
  })
}

async function deleteCanonicalRoles(keys = CANONICAL_KEYS): Promise<void> {
  const prisma = await getPrisma()
  const roles = await prisma.role.findMany({
    where: { key: { in: [...keys] } },
    select: { id: true },
  })

  await prisma.rolePermission.deleteMany({
    where: { roleId: { in: roles.map(({ id }) => id) } },
  })
  await prisma.role.deleteMany({
    where: { key: { in: [...keys] } },
  })
}

async function restoreOriginalCanonicalRoles(): Promise<void> {
  assertRolesTestDatabase()

  const prisma = await getPrisma()

  await deleteCanonicalRoles()

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

  if (originalCanonicalRolePermissions.length > 0) {
    await prisma.rolePermission.createMany({
      data: originalCanonicalRolePermissions,
    })
  }
}

function expectCatalogMatchesMetadata(
  roles: CanonicalRoleSnapshot[]
): void {
  expect(roles).toHaveLength(SYSTEM_ROLE_METADATA.length)

  for (const expected of SYSTEM_ROLE_METADATA) {
    const role = roles.find((entry) => entry.key === expected.key)

    expect(role).toBeDefined()
    expect(role?.name).toBe(expected.name)
    expect(role?.isSystem).toBe(expected.isSystem)
    expect(role?.sortOrder).toBe(expected.sortOrder)
  }
}

describe('System Role seed (R-026)', () => {
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

  it('creates the canonical catalog on first seed', async () => {
    await deleteCanonicalRoles()

    expect(await loadCanonicalRoles()).toHaveLength(0)

    await seedCatalog()

    expectCatalogMatchesMetadata(await loadCanonicalRoles())
  })

  it('keeps the same Role identities on repeated seed', async () => {
    await seedCatalog()

    const first = await loadCanonicalRoles()
    expectCatalogMatchesMetadata(first)

    const firstIds = first.map((role) => ({ key: role.key, id: role.id }))

    await seedCatalog()

    const second = await loadCanonicalRoles()
    expectCatalogMatchesMetadata(second)

    expect(second.map((role) => ({ key: role.key, id: role.id }))).toEqual(
      firstIds
    )
  })

  it('recreates a missing canonical Role through seed only', async () => {
    const missingKey = SYSTEM_ROLE_METADATA[SYSTEM_ROLE_METADATA.length - 1].key

    await seedCatalog()

    await deleteCanonicalRoles([missingKey])

    const { resolveRequiredRole } = await import(
      '@/core/modules/roles/services/resolve-required-role'
    )

    try {
      await resolveRequiredRole(missingKey)
      expect.unreachable('Expected REQUIRED_ROLE_MISSING')
    } catch (error) {
      expect(error).toBeInstanceOf(RoleError)
      expect((error as RoleError).code).toBe(ROLE_ERROR_CODES.REQUIRED_MISSING)
    }

    const { findRoleByKey } = await import(
      '@/core/modules/roles/services/find-role-by-key'
    )
    expect(await findRoleByKey(missingKey)).toBeNull()

    await seedCatalog()

    const restored = await findRoleByKey(missingKey)
    expect(restored).not.toBeNull()
    expect(restored?.key).toBe(missingKey)
    expect(restored?.isSystem).toBe(true)
  })

  it('reconciles approved metadata and preserves description', async () => {
    const prisma = await getPrisma()
    const target = SYSTEM_ROLE_METADATA[0]

    await seedCatalog()

    await prisma.role.update({
      where: { key: target.key },
      data: {
        name: 'Drifted Name',
        sortOrder: 999,
        isSystem: false,
        description: 'preserved-by-seed-policy',
      },
    })

    await seedCatalog()

    const reconciled = await prisma.role.findUnique({
      where: { key: target.key },
    })

    expect(reconciled).not.toBeNull()
    expect(reconciled?.name).toBe(target.name)
    expect(reconciled?.sortOrder).toBe(target.sortOrder)
    expect(reconciled?.isSystem).toBe(target.isSystem)
    expect(reconciled?.description).toBe('preserved-by-seed-policy')
  })
})
