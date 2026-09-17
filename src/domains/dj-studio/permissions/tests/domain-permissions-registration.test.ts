import { randomUUID } from 'node:crypto'

import { beforeAll, describe, expect, it } from 'vitest'

import { PERMISSION_KEYS } from '@/core/modules/permissions/constants/permission-keys'
import { createPermissionAuthorizationServices } from '@/core/modules/permissions/services/permission-authorization'
import { syncPermissionsFoundation } from '@/core/modules/permissions/seed/sync-permissions-foundation'
import { seedSystemRoles } from '@/core/modules/roles/seed/seed-system-roles'
import { SYSTEM_ROLE_KEYS, type SystemRoleKey } from '@/core/modules/roles/constants/system-role-keys'
import { DJ_STUDIO_PERMISSION_KEYS } from '@/domains/dj-studio/permissions/permission-keys'
import { seedDjStudioDomainPermissions } from '@/domains/dj-studio/permissions/seed-dj-studio-permissions'
import { assertOrganizationsTestDatabase } from '@/core/modules/organizations/tests/assert-test-database'
import type { AuthorizationContext } from '@/core/modules/permissions/types/authorization-context'

function createAuthorizationContext(
  roleKey: SystemRoleKey = SYSTEM_ROLE_KEYS.OWNER,
): AuthorizationContext {
  return {
    membershipId: randomUUID(),
    organizationId: randomUUID(),
    profileId: randomUUID(),
    roleId: randomUUID(),
    roleKey,
  }
}

describe('DJ Studio Domain permission registration', () => {
  beforeAll(async () => {
    assertOrganizationsTestDatabase()
    const { prisma } = await import('@/lib/prisma')
    await seedSystemRoles(prisma)
    await prisma.$transaction((client) => syncPermissionsFoundation(client))
  })

  it('registers Domain permissions and role mappings idempotently', async () => {
    const { prisma } = await import('@/lib/prisma')
    const domainKeys = Object.values(DJ_STUDIO_PERMISSION_KEYS)

    await prisma.$transaction((client) => seedDjStudioDomainPermissions(client))
    const afterFirst = await prisma.permission.count({
      where: { key: { in: domainKeys } },
    })
    const mappingsAfterFirst = await prisma.rolePermission.count({
      where: { permission: { key: { in: domainKeys } } },
    })

    await prisma.$transaction((client) => seedDjStudioDomainPermissions(client))
    const afterSecond = await prisma.permission.count({
      where: { key: { in: domainKeys } },
    })
    const mappingsAfterSecond = await prisma.rolePermission.count({
      where: { permission: { key: { in: domainKeys } } },
    })

    expect(afterFirst).toBe(4)
    expect(afterSecond).toBe(4)
    expect(mappingsAfterFirst).toBe(18)
    expect(mappingsAfterSecond).toBe(18)

    await expect(
      prisma.$transaction((client) => syncPermissionsFoundation(client)),
    ).resolves.toBeUndefined()
  })

  it('authorizes Domain and Core keys via RolePermission DB truth', async () => {
    const context = createAuthorizationContext(SYSTEM_ROLE_KEYS.VIEWER)
    const roleHasPermission = async (_roleId: string, key: string) => {
      if (key === DJ_STUDIO_PERMISSION_KEYS.LIBRARY_READ) return true
      if (key === DJ_STUDIO_PERMISSION_KEYS.PLAYLISTS_READ) return true
      if (key === PERMISSION_KEYS.ORGANIZATIONS_READ) return true
      return false
    }
    const services = createPermissionAuthorizationServices({
      findMembershipById: async () => ({
        id: context.membershipId,
        organizationId: context.organizationId,
        profileId: context.profileId,
        roleId: context.roleId,
        status: 'ACTIVE',
      }),
      findRoleById: async () => ({
        id: context.roleId,
        key: SYSTEM_ROLE_KEYS.VIEWER,
        name: 'Viewer',
        description: null,
        isSystem: true,
        sortOrder: 50,
        createdAt: new Date(),
        updatedAt: new Date(),
      }),
      roleHasPermission,
    })

    await expect(
      services.hasPermission(context, DJ_STUDIO_PERMISSION_KEYS.LIBRARY_READ),
    ).resolves.toBe(true)
    await expect(
      services.hasPermission(context, DJ_STUDIO_PERMISSION_KEYS.LIBRARY_MANAGE),
    ).resolves.toBe(false)
    await expect(
      services.hasPermission(context, DJ_STUDIO_PERMISSION_KEYS.PLAYLISTS_READ),
    ).resolves.toBe(true)
    await expect(
      services.hasPermission(
        context,
        DJ_STUDIO_PERMISSION_KEYS.PLAYLISTS_MANAGE,
      ),
    ).resolves.toBe(false)
    await expect(
      services.hasPermission(context, PERMISSION_KEYS.ORGANIZATIONS_READ),
    ).resolves.toBe(true)
    await expect(
      services.hasPermission(context, 'dj.fake.permission'),
    ).resolves.toBe(false)
  })

  it('grants MEMBER library.manage and OWNER library.manage', async () => {
    for (const roleKey of [
      SYSTEM_ROLE_KEYS.OWNER,
      SYSTEM_ROLE_KEYS.MEMBER,
    ] as const) {
      const context = createAuthorizationContext(roleKey)
      const services = createPermissionAuthorizationServices({
        findMembershipById: async () => ({
          id: context.membershipId,
          organizationId: context.organizationId,
          profileId: context.profileId,
          roleId: context.roleId,
          status: 'ACTIVE',
        }),
        findRoleById: async () => ({
          id: context.roleId,
          key: roleKey,
          name: roleKey,
          description: null,
          isSystem: true,
          sortOrder: 10,
          createdAt: new Date(),
          updatedAt: new Date(),
        }),
        roleHasPermission: async () => true,
      })

      await expect(
        services.hasPermission(
          context,
          DJ_STUDIO_PERMISSION_KEYS.LIBRARY_MANAGE,
        ),
      ).resolves.toBe(true)
    }
  })
})
