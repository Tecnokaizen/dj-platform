import { randomUUID } from 'node:crypto'

import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest'

import { createMembershipRepository } from '@/core/modules/memberships/repositories/membership-repository'
import { PERMISSION_KEYS } from '@/core/modules/permissions/constants/permission-keys'
import { PERMISSION_ERROR_CODES } from '@/core/modules/permissions/errors/permission-error'
import { createRolePermissionRepository } from '@/core/modules/permissions/repositories/role-permission-repository'
import { createPermissionAuthorizationServices } from '@/core/modules/permissions/services/permission-authorization'
import { createAuthorizedOrganizationOperationRunner } from '@/core/modules/permissions/services/require-organization-permission'
import { syncPermissionsFoundation } from '@/core/modules/permissions/seed/sync-permissions-foundation'
import { organizationSelect } from '@/core/modules/organizations/persistence/organization-select'
import { createSuspendOrganization } from '@/core/modules/organizations/services/suspend-organization'
import { createResolveOrganizationContextService } from '@/core/modules/organizations/services/switch-active-organization'
import { createUpdateOrganization } from '@/core/modules/organizations/services/update-organization'
import {
  assertOrganizationsTestDatabase,
  createOrganizationTestSlug,
} from '@/core/modules/organizations/tests/assert-test-database'
import {
  createOwnedOrganizationTestRecord,
  deleteOrganizationTestRecords,
} from '@/core/modules/organizations/tests/organization-owner-fixture'
import { seedSystemRoles } from '@/core/modules/roles/seed/seed-system-roles'
import type { Prisma, PrismaClient } from '@/generated/prisma/client'

const TEST_PREFIX = 'o037-test-'
type TestedRoleKey = 'OWNER' | 'ADMIN' | 'MEMBER' | 'VIEWER'

async function cleanup(): Promise<void> {
  assertOrganizationsTestDatabase()
  const { prisma } = await import('@/lib/prisma')

  await deleteOrganizationTestRecords(prisma, {
    slug: { startsWith: TEST_PREFIX },
  })

  await prisma.profile.deleteMany({
    where: { username: { startsWith: TEST_PREFIX } },
  })
}

async function createAuthorizedActor(roleKey: TestedRoleKey) {
  const { prisma } = await import('@/lib/prisma')
  await seedSystemRoles(prisma)
  await syncPermissionsFoundation(prisma)

  const role = await prisma.role.findUniqueOrThrow({ where: { key: roleKey } })
  const profileId = randomUUID()
  const suffix = randomUUID().slice(0, 12)

  await prisma.profile.create({
    data: {
      id: profileId,
      username: `${TEST_PREFIX}${roleKey.toLowerCase()}-${suffix}`,
    },
  })
  const { organization } = await createOwnedOrganizationTestRecord(
    prisma,
    {
      name: 'O-037 Org',
      slug: createOrganizationTestSlug(TEST_PREFIX),
    },
    roleKey === 'OWNER' ? profileId : undefined,
  )

  if (roleKey !== 'OWNER') {
    await prisma.organizationMembership.create({
      data: {
        organizationId: organization.id,
        profileId,
        roleId: role.id,
        status: 'ACTIVE',
      },
    })
  }

  return { organization, profileId, prisma }
}

function createTestAuthorizedRunner(profileId: string, prisma: PrismaClient) {
  return createAuthorizedOrganizationOperationRunner<Prisma.TransactionClient>({
    getCurrentProfileId: async () => profileId,
    runInTransaction: (operation) =>
      prisma.$transaction(operation, { isolationLevel: 'Serializable' }),
    resolveOrganizationContext: async (
      client,
      actorProfileId,
      organizationId,
      allowedOrganizationStatuses
    ) => {
      const membershipRepository = createMembershipRepository(client)
      return createResolveOrganizationContextService({
        getCurrentProfileId: async () => actorProfileId,
        findOrganizationById: (id) =>
          client.organization.findUnique({
            where: { id },
            select: organizationSelect,
          }),
        findActiveMembership:
          membershipRepository.findActiveByOrganizationAndProfile,
        findRoleById: (id) => client.role.findUnique({ where: { id } }),
        allowedOrganizationStatuses,
      })(organizationId)
    },
    requirePermission: async (client, context, permissionKey) => {
      const membershipRepository = createMembershipRepository(client)
      const rolePermissionRepository = createRolePermissionRepository(client)
      return createPermissionAuthorizationServices({
        findMembershipById: membershipRepository.findById,
        findRoleById: (roleId) =>
          client.role.findUnique({ where: { id: roleId } }),
        roleHasPermission: rolePermissionRepository.exists,
      }).requirePermission(context, permissionKey)
    },
  })
}

describe('Organization permission authorization (O-037)', () => {
  beforeAll(async () => {
    assertOrganizationsTestDatabase()
    await cleanup()
  })

  afterEach(async () => {
    await cleanup()
  })

  afterAll(async () => {
    await cleanup()
  })

  it.each(['OWNER', 'ADMIN'] as const)(
    'allows organizations.update for %s through the authorized wrapper',
    async (roleKey) => {
    const { organization, profileId, prisma } =
      await createAuthorizedActor(roleKey)
    const runAuthorized = createTestAuthorizedRunner(profileId, prisma)

    const updated = await runAuthorized({
      permissionKey: PERMISSION_KEYS.ORGANIZATIONS_UPDATE,
      resolveOrganizationId: async () => organization.id,
      execute: async (client) =>
        createUpdateOrganization(client)(organization.id, {
          name: 'O-037 Updated',
        }),
    })

    expect(updated.name).toBe('O-037 Updated')
    }
  )

  it.each(['MEMBER', 'VIEWER'] as const)(
    'denies organizations.update for %s and does not write',
    async (roleKey) => {
    const { organization, profileId, prisma } =
      await createAuthorizedActor(roleKey)
    const runAuthorized = createTestAuthorizedRunner(profileId, prisma)

    await expect(
      runAuthorized({
        permissionKey: PERMISSION_KEYS.ORGANIZATIONS_UPDATE,
        resolveOrganizationId: async () => organization.id,
        execute: async (client) =>
          createSuspendOrganization(client)(organization.id),
      }),
    ).rejects.toMatchObject({
      name: 'PermissionError',
      code: PERMISSION_ERROR_CODES.DENIED,
    })

    await expect(
      prisma.organization.findUniqueOrThrow({ where: { id: organization.id } }),
    ).resolves.toMatchObject({ status: 'ACTIVE' })
    }
  )
})
