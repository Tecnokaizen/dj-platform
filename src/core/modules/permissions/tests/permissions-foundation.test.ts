import { randomUUID } from 'node:crypto'

import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'

import {
  PERMISSION_DEFINITIONS,
  validatePermissionDefinitions,
} from '@/core/modules/permissions/constants/permission-definitions'
import { PERMISSION_KEYS } from '@/core/modules/permissions/constants/permission-keys'
import { SYSTEM_ROLE_PERMISSION_POLICY } from '@/core/modules/permissions/constants/system-role-permission-policy'
import {
  PERMISSION_ERROR_CODES,
  PermissionError,
} from '@/core/modules/permissions/errors/permission-error'
import {
  syncPermissionCatalog,
  syncPermissionsFoundation,
  syncSystemRolePermissionPolicy,
  validatePermissionCatalog,
  validateSystemRolePermissionPolicy,
} from '@/core/modules/permissions/seed/sync-permissions-foundation'
import { createPermissionAuthorizationServices } from '@/core/modules/permissions/services/permission-authorization'
import { createAuthorizedOrganizationOperationRunner } from '@/core/modules/permissions/services/require-organization-permission'
import type { AuthorizationContext } from '@/core/modules/permissions/types/authorization-context'
import { assertOrganizationsTestDatabase } from '@/core/modules/organizations/tests/assert-test-database'
import { seedSystemRoles } from '@/core/modules/roles/seed/seed-system-roles'

const EXPECTED_MAPPING_COUNT = 27

function createAuthorizationContext(
  overrides: Partial<AuthorizationContext> = {}
): AuthorizationContext {
  return {
    profileId: randomUUID(),
    organizationId: randomUUID(),
    membershipId: randomUUID(),
    roleId: randomUUID(),
    roleKey: 'ADMIN',
    ...overrides,
  }
}

describe('Permissions Foundation registry and policy', () => {
  it('contains exactly the canonical keys without wildcard or duplicate invite aliases', () => {
    expect(() => validatePermissionDefinitions()).not.toThrow()
    expect(PERMISSION_DEFINITIONS).toHaveLength(12)
    expect(PERMISSION_DEFINITIONS.map(({ key }) => key)).not.toContain(
      'memberships.invite'
    )
    expect(PERMISSION_DEFINITIONS.some(({ key }) => key.includes('*'))).toBe(
      false
    )
  })

  it('uses the explicit conservative system Role policy', () => {
    expect(SYSTEM_ROLE_PERMISSION_POLICY.OWNER).toEqual(
      Object.values(PERMISSION_KEYS)
    )
    expect(SYSTEM_ROLE_PERMISSION_POLICY.ADMIN).not.toContain(
      PERMISSION_KEYS.ORGANIZATIONS_TRANSFER_OWNERSHIP
    )
    expect(SYSTEM_ROLE_PERMISSION_POLICY.MANAGER).toEqual([
      PERMISSION_KEYS.ORGANIZATIONS_READ,
      PERMISSION_KEYS.MEMBERSHIPS_READ,
    ])
    expect(SYSTEM_ROLE_PERMISSION_POLICY.MEMBER).toEqual([
      PERMISSION_KEYS.ORGANIZATIONS_READ,
    ])
    expect(SYSTEM_ROLE_PERMISSION_POLICY.VIEWER).toEqual([
      PERMISSION_KEYS.ORGANIZATIONS_READ,
    ])
  })
})

describe('Permissions Foundation persistence', () => {
  beforeAll(async () => {
    assertOrganizationsTestDatabase()
    const { prisma } = await import('@/lib/prisma')
    await seedSystemRoles(prisma)
    await prisma.$transaction((client) => syncPermissionsFoundation(client))
  })

  afterAll(async () => {
    const { prisma } = await import('@/lib/prisma')
    await prisma.$disconnect()
  })

  it('synchronizes the catalog and policy idempotently', async () => {
    const { prisma } = await import('@/lib/prisma')

    await prisma.$transaction((client) => syncPermissionsFoundation(client))
    await prisma.$transaction((client) => syncPermissionsFoundation(client))

    await expect(prisma.permission.count()).resolves.toBe(12)
    await expect(prisma.rolePermission.count()).resolves.toBe(
      EXPECTED_MAPPING_COUNT
    )
    await expect(validatePermissionCatalog(prisma)).resolves.toBeUndefined()
    await expect(
      validateSystemRolePermissionPolicy(prisma)
    ).resolves.toBeUndefined()
  })

  it('detects canonical Permission metadata drift without writing during validation', async () => {
    const { prisma } = await import('@/lib/prisma')
    const permissionKey = PERMISSION_KEYS.ORGANIZATIONS_READ

    await prisma.permission.update({
      where: { key: permissionKey },
      data: { name: 'Drifted Permission name' },
    })

    try {
      await expect(validatePermissionCatalog(prisma)).rejects.toMatchObject({
        code: PERMISSION_ERROR_CODES.CATALOG_DRIFT,
      })
      await expect(
        prisma.permission.findUniqueOrThrow({ where: { key: permissionKey } })
      ).resolves.toMatchObject({ name: 'Drifted Permission name' })
    } finally {
      await syncPermissionCatalog(prisma)
    }
  })

  it('detects a missing system RolePermission mapping without silently restoring it', async () => {
    const { prisma } = await import('@/lib/prisma')
    const [viewer, permission] = await Promise.all([
      prisma.role.findUniqueOrThrow({ where: { key: 'VIEWER' } }),
      prisma.permission.findUniqueOrThrow({
        where: { key: PERMISSION_KEYS.ORGANIZATIONS_READ },
      }),
    ])
    const mappingKey = {
      roleId_permissionId: {
        roleId: viewer.id,
        permissionId: permission.id,
      },
    }

    await prisma.rolePermission.delete({ where: mappingKey })

    try {
      await expect(
        validateSystemRolePermissionPolicy(prisma)
      ).rejects.toMatchObject({
        code: PERMISSION_ERROR_CODES.POLICY_DRIFT,
      })
      await expect(
        prisma.rolePermission.findUnique({ where: mappingKey })
      ).resolves.toBeNull()
    } finally {
      await syncSystemRolePermissionPolicy(prisma)
    }
  })

  it('detects unknown persisted Permissions without deleting them', async () => {
    const { prisma } = await import('@/lib/prisma')
    const unknownKey = `test.unknown_${randomUUID().replaceAll('-', '')}`

    await prisma.permission.create({
      data: { key: unknownKey, name: 'Unknown test Permission' },
    })

    try {
      await expect(
        prisma.$transaction((client) => syncPermissionsFoundation(client))
      ).rejects.toMatchObject({
        code: PERMISSION_ERROR_CODES.CATALOG_DRIFT,
      })
      await expect(
        prisma.permission.findUnique({ where: { key: unknownKey } })
      ).resolves.not.toBeNull()
    } finally {
      await prisma.permission.delete({ where: { key: unknownKey } })
    }
  })

  it('detects unexpected RolePermission grants without reconciling them silently', async () => {
    const { prisma } = await import('@/lib/prisma')
    const [viewer, removePermission] = await Promise.all([
      prisma.role.findUniqueOrThrow({ where: { key: 'VIEWER' } }),
      prisma.permission.findUniqueOrThrow({
        where: { key: PERMISSION_KEYS.MEMBERSHIPS_REMOVE },
      }),
    ])

    await prisma.rolePermission.upsert({
      where: {
        roleId_permissionId: {
          roleId: viewer.id,
          permissionId: removePermission.id,
        },
      },
      create: { roleId: viewer.id, permissionId: removePermission.id },
      update: {},
    })

    try {
      await expect(
        prisma.$transaction((client) => syncPermissionsFoundation(client))
      ).rejects.toMatchObject({
        code: PERMISSION_ERROR_CODES.POLICY_DRIFT,
      })
    } finally {
      await prisma.rolePermission.delete({
        where: {
          roleId_permissionId: {
            roleId: viewer.id,
            permissionId: removePermission.id,
          },
        },
      })
    }
  })
})

describe('tenant-scoped Permission authorization', () => {
  it('requires a current ACTIVE Membership and explicit RolePermission mapping', async () => {
    const context = createAuthorizationContext({ roleKey: 'OWNER' })
    const roleHasPermission = vi.fn(async () => true)
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
        key: 'OWNER',
        name: 'Owner',
        description: null,
        isSystem: true,
        sortOrder: 10,
        createdAt: new Date(),
        updatedAt: new Date(),
      }),
      roleHasPermission,
    })

    await expect(
      services.hasPermission(context, PERMISSION_KEYS.MEMBERSHIPS_REMOVE)
    ).resolves.toBe(true)
    expect(roleHasPermission).toHaveBeenCalledWith(
      context.roleId,
      PERMISSION_KEYS.MEMBERSHIPS_REMOVE
    )
  })

  it.each(['SUSPENDED', 'REMOVED'] as const)(
    'denies a %s Membership before evaluating RolePermission',
    async (status) => {
      const context = createAuthorizationContext()
      const roleHasPermission = vi.fn(async () => true)
      const services = createPermissionAuthorizationServices({
        findMembershipById: async () => ({
          id: context.membershipId,
          organizationId: context.organizationId,
          profileId: context.profileId,
          roleId: context.roleId,
          status,
        }),
        findRoleById: vi.fn(),
        roleHasPermission,
      })

      await expect(
        services.hasPermission(context, PERMISSION_KEYS.MEMBERSHIPS_READ)
      ).resolves.toBe(false)
      expect(roleHasPermission).not.toHaveBeenCalled()
    }
  )

  it('denies a cross-tenant context and unknown Permission keys', async () => {
    const context = createAuthorizationContext()
    const role = {
      id: context.roleId,
      key: context.roleKey,
      name: 'Admin',
      description: null,
      isSystem: true,
      sortOrder: 20,
      createdAt: new Date(),
      updatedAt: new Date(),
    }
    const services = createPermissionAuthorizationServices({
      findMembershipById: async () => ({
        id: context.membershipId,
        organizationId: randomUUID(),
        profileId: context.profileId,
        roleId: context.roleId,
        status: 'ACTIVE',
      }),
      findRoleById: vi.fn(),
      roleHasPermission: vi.fn(async () => true),
    })
    const validTenantServices = createPermissionAuthorizationServices({
      findMembershipById: async () => ({
        id: context.membershipId,
        organizationId: context.organizationId,
        profileId: context.profileId,
        roleId: context.roleId,
        status: 'ACTIVE',
      }),
      findRoleById: async () => role,
      roleHasPermission: vi.fn(async () => true),
    })

    await expect(
      services.hasPermission(context, PERMISSION_KEYS.MEMBERSHIPS_READ)
    ).resolves.toBe(false)
    await expect(
      validTenantServices.hasPermission(context, 'memberships.unknown')
    ).resolves.toBe(false)
  })

  it('returns the validated context or a stable PERMISSION_DENIED error', async () => {
    const context = createAuthorizationContext()
    const granted = createPermissionAuthorizationServices({
      findMembershipById: async () => ({
        id: context.membershipId,
        organizationId: context.organizationId,
        profileId: context.profileId,
        roleId: context.roleId,
        status: 'ACTIVE',
      }),
      findRoleById: async () => ({
        id: context.roleId,
        key: context.roleKey,
        name: 'Admin',
        description: null,
        isSystem: true,
        sortOrder: 20,
        createdAt: new Date(),
        updatedAt: new Date(),
      }),
      roleHasPermission: async () => true,
    })
    const denied = createPermissionAuthorizationServices({
      findMembershipById: async () => null,
      findRoleById: vi.fn(),
      roleHasPermission: vi.fn(),
    })

    await expect(
      granted.requirePermission(context, PERMISSION_KEYS.MEMBERSHIPS_READ)
    ).resolves.toBe(context)
    await expect(
      denied.requirePermission(context, PERMISSION_KEYS.MEMBERSHIPS_READ)
    ).rejects.toMatchObject({
      name: 'PermissionError',
      code: PERMISSION_ERROR_CODES.DENIED,
    })
  })

  it('resolves and authorizes tenant context before calling the protected operation', async () => {
    const context = createAuthorizationContext()
    const transactionClient = { id: 'transaction-client' }
    const callOrder: string[] = []
    const runAuthorizedOperation = createAuthorizedOrganizationOperationRunner({
      getCurrentProfileId: async () => context.profileId,
      runInTransaction: async (operation) => {
        callOrder.push('transaction')
        return operation(transactionClient)
      },
      resolveOrganizationContext: async (client, profileId, organizationId) => {
        expect(client).toBe(transactionClient)
        expect(profileId).toBe(context.profileId)
        expect(organizationId).toBe(context.organizationId)
        callOrder.push('context')
        return context
      },
      requirePermission: async (client, receivedContext, permissionKey) => {
        expect(client).toBe(transactionClient)
        expect(receivedContext).toBe(context)
        expect(permissionKey).toBe(PERMISSION_KEYS.INVITATIONS_CREATE)
        callOrder.push('permission')
        return context
      },
    })

    await expect(
      runAuthorizedOperation({
        permissionKey: PERMISSION_KEYS.INVITATIONS_CREATE,
        resolveOrganizationId: async (client) => {
          expect(client).toBe(transactionClient)
          callOrder.push('target')
          return context.organizationId
        },
        execute: async (client, receivedContext) => {
          expect(client).toBe(transactionClient)
          expect(receivedContext).toBe(context)
          callOrder.push('execute')
          return 'written'
        },
      })
    ).resolves.toBe('written')
    expect(callOrder).toEqual([
      'transaction',
      'target',
      'context',
      'permission',
      'execute',
    ])
  })

  it('does not invoke or write through the protected callback when permission is denied', async () => {
    const context = createAuthorizationContext()
    const transactionClient = { id: 'transaction-client' }
    let persistedWrites = 0
    const protectedWrite = vi.fn(async () => {
      persistedWrites += 1
      return 'written'
    })
    const runAuthorizedOperation = createAuthorizedOrganizationOperationRunner({
      getCurrentProfileId: async () => context.profileId,
      runInTransaction: (operation) => operation(transactionClient),
      resolveOrganizationContext: async () => context,
      requirePermission: async () => {
        throw new PermissionError(PERMISSION_ERROR_CODES.DENIED)
      },
    })

    await expect(
      runAuthorizedOperation({
        permissionKey: PERMISSION_KEYS.MEMBERSHIPS_SUSPEND,
        resolveOrganizationId: async () => context.organizationId,
        execute: protectedWrite,
      })
    ).rejects.toMatchObject({
      name: 'PermissionError',
      code: PERMISSION_ERROR_CODES.DENIED,
    })
    expect(protectedWrite).not.toHaveBeenCalled()
    expect(persistedWrites).toBe(0)
  })

  it('does not open a transaction for an unauthenticated actor', async () => {
    const runInTransaction = vi.fn()
    const runAuthorizedOperation = createAuthorizedOrganizationOperationRunner({
      getCurrentProfileId: async () => null,
      runInTransaction,
      resolveOrganizationContext: vi.fn(),
      requirePermission: vi.fn(),
    })

    await expect(
      runAuthorizedOperation({
        permissionKey: PERMISSION_KEYS.MEMBERSHIPS_READ,
        resolveOrganizationId: async () => randomUUID(),
        execute: vi.fn(),
      })
    ).rejects.toMatchObject({
      name: 'ProfileError',
      code: 'PROFILE_NOT_FOUND',
    })
    expect(runInTransaction).not.toHaveBeenCalled()
  })
})
