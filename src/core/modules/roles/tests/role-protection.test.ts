import { readdir } from 'node:fs/promises'
import path from 'node:path'

import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import type { Role } from '@/generated/prisma/client'
import { SYSTEM_ROLE_KEYS } from '@/core/modules/roles/constants/system-role-keys'
import { SYSTEM_ROLE_METADATA } from '@/core/modules/roles/constants/system-role-metadata'
import { assertRolesTestDatabase } from '@/core/modules/roles/tests/assert-test-database'

const CANONICAL_KEYS = SYSTEM_ROLE_METADATA.map((role) => role.key)

const APPROVED_SERVICE_FILES = [
  'find-role-by-id.ts',
  'find-role-by-key.ts',
  'find-system-roles.ts',
  'get-role-by-key.ts',
  'get-role.ts',
  'list-system-roles.ts',
  'resolve-required-role.ts',
  'validate-system-role-catalog.ts',
] as const

const FORBIDDEN_EXPORT_NAMES = [
  'deleteRole',
  'renameRoleKey',
  'changeSystemStatus',
  'createRole',
  'updateRole',
  'updateRoleKey',
] as const

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

async function restoreOriginalCanonicalRoles(): Promise<void> {
  assertRolesTestDatabase()

  const prisma = await getPrisma()

  const roles = await prisma.role.findMany({
    where: { key: { in: [...CANONICAL_KEYS] } },
    select: { id: true },
  })
  await prisma.rolePermission.deleteMany({
    where: { roleId: { in: roles.map(({ id }) => id) } },
  })
  await prisma.role.deleteMany({ where: { key: { in: [...CANONICAL_KEYS] } } })

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

describe('System Role protection (R-028)', () => {
  beforeAll(async () => {
    assertRolesTestDatabase()
    await captureOriginalCanonicalRoles()
    await seedCatalog()
  })

  afterAll(async () => {
    await restoreOriginalCanonicalRoles()
    expect(await loadCanonicalRoles()).toEqual(originalCanonicalRoles)
  })

  it('exposes only approved non-mutation Roles services', async () => {
    const servicesDir = path.resolve(
      process.cwd(),
      'src/core/modules/roles/services'
    )
    const files = (await readdir(servicesDir)).filter((file) =>
      file.endsWith('.ts')
    )

    expect(files.sort()).toEqual([...APPROVED_SERVICE_FILES].sort())
  })

  it('does not export casual Role mutation operations from application services', async () => {
    const modules = await Promise.all([
      import('@/core/modules/roles/services/find-role-by-id'),
      import('@/core/modules/roles/services/find-role-by-key'),
      import('@/core/modules/roles/services/find-system-roles'),
      import('@/core/modules/roles/services/get-role'),
      import('@/core/modules/roles/services/get-role-by-key'),
      import('@/core/modules/roles/services/list-system-roles'),
      import('@/core/modules/roles/services/resolve-required-role'),
      import('@/core/modules/roles/services/validate-system-role-catalog'),
    ])

    for (const moduleExports of modules) {
      for (const forbidden of FORBIDDEN_EXPORT_NAMES) {
        expect(moduleExports).not.toHaveProperty(forbidden)
      }
    }
  })

  it('does not delete, rename, or demote canonical Roles through normal services', async () => {
    const before = await loadCanonicalRoles()
    expect(before).toHaveLength(SYSTEM_ROLE_METADATA.length)

    const ownerBefore = before.find((role) => role.key === SYSTEM_ROLE_KEYS.OWNER)
    expect(ownerBefore).toBeDefined()

    const { findRoleById } = await import(
      '@/core/modules/roles/services/find-role-by-id'
    )
    const { findRoleByKey } = await import(
      '@/core/modules/roles/services/find-role-by-key'
    )
    const { findSystemRoles } = await import(
      '@/core/modules/roles/services/find-system-roles'
    )
    const { getRole } = await import('@/core/modules/roles/services/get-role')
    const { getRoleByKey } = await import(
      '@/core/modules/roles/services/get-role-by-key'
    )
    const { listSystemRoles } = await import(
      '@/core/modules/roles/services/list-system-roles'
    )
    const { resolveRequiredRole } = await import(
      '@/core/modules/roles/services/resolve-required-role'
    )
    const { validateSystemRoleCatalog } = await import(
      '@/core/modules/roles/services/validate-system-role-catalog'
    )

    await findRoleById(ownerBefore!.id)
    await findRoleByKey(SYSTEM_ROLE_KEYS.OWNER)
    await findSystemRoles()
    await getRole(ownerBefore!.id)
    await getRoleByKey(SYSTEM_ROLE_KEYS.OWNER)
    await listSystemRoles()
    await resolveRequiredRole(SYSTEM_ROLE_KEYS.OWNER)
    await validateSystemRoleCatalog()

    const after = await loadCanonicalRoles()

    expect(after).toEqual(before)

    for (const expected of SYSTEM_ROLE_METADATA) {
      const role = after.find((entry) => entry.key === expected.key)

      expect(role).toBeDefined()
      expect(role?.key).toBe(expected.key)
      expect(role?.isSystem).toBe(true)
    }
  })
})
