import { randomUUID } from 'node:crypto'

import { PrismaPg } from '@prisma/adapter-pg'
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest'

import { MEMBERSHIP_ERROR_CODES } from '@/core/modules/memberships/errors/membership-error'
import { createMembershipRepository } from '@/core/modules/memberships/repositories/membership-repository'
import { createTransferOrganizationOwnershipService } from '@/core/modules/memberships/services/transfer-organization-ownership'
import { PERMISSION_KEYS } from '@/core/modules/permissions/constants/permission-keys'
import { PERMISSION_ERROR_CODES } from '@/core/modules/permissions/errors/permission-error'
import { createRolePermissionRepository } from '@/core/modules/permissions/repositories/role-permission-repository'
import { createPermissionAuthorizationServices } from '@/core/modules/permissions/services/permission-authorization'
import { createAuthorizedOrganizationOperationRunner } from '@/core/modules/permissions/services/require-organization-permission'
import { syncPermissionsFoundation } from '@/core/modules/permissions/seed/sync-permissions-foundation'
import { organizationSelect } from '@/core/modules/organizations/persistence/organization-select'
import { createResolveOrganizationContextService } from '@/core/modules/organizations/services/switch-active-organization'
import {
  assertOrganizationsTestDatabase,
  createOrganizationTestSlug,
} from '@/core/modules/organizations/tests/assert-test-database'
import {
  createOwnedOrganizationTestRecord,
  deleteOrganizationTestRecords,
} from '@/core/modules/organizations/tests/organization-owner-fixture'
import { seedSystemRoles } from '@/core/modules/roles/seed/seed-system-roles'
import { PrismaClient, type Prisma } from '@/generated/prisma/client'

const TEST_PREFIX = 'm088-test-'

function createIndependentTestClient(): PrismaClient {
  const connectionString = process.env.DATABASE_URL

  if (!connectionString) {
    throw new Error('DATABASE_URL no está definida')
  }

  return new PrismaClient({
    adapter: new PrismaPg({ connectionString }),
  })
}

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

async function createProfile(prisma: PrismaClient, label: string) {
  const id = randomUUID()
  await prisma.profile.create({
    data: {
      id,
      username: `${TEST_PREFIX}${label}-${randomUUID().slice(0, 8)}`,
    },
  })
  return id
}

function createAuthorizedRunner(profileId: string, prisma: PrismaClient) {
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

async function createContext() {
  const { prisma } = await import('@/lib/prisma')
  await seedSystemRoles(prisma)
  await syncPermissionsFoundation(prisma)
  const [ownerRole, adminRole, memberRole] = await Promise.all([
    prisma.role.findUniqueOrThrow({ where: { key: 'OWNER' } }),
    prisma.role.findUniqueOrThrow({ where: { key: 'ADMIN' } }),
    prisma.role.findUniqueOrThrow({ where: { key: 'MEMBER' } }),
  ])
  const ownerProfileId = await createProfile(prisma, 'owner')
  const targetProfileId = await createProfile(prisma, 'target')
  const secondTargetProfileId = await createProfile(prisma, 'second-target')
  const { organization, ownerMembership } =
    await createOwnedOrganizationTestRecord(
      prisma,
      {
        name: 'Ownership Transfer Test',
        slug: createOrganizationTestSlug(TEST_PREFIX),
      },
      ownerProfileId
    )
  const repository = createMembershipRepository(prisma)
  const targetMembership = await repository.create({
    organizationId: organization.id,
    profileId: targetProfileId,
    roleId: memberRole.id,
  })
  const secondTargetMembership = await repository.create({
    organizationId: organization.id,
    profileId: secondTargetProfileId,
    roleId: memberRole.id,
  })

  return {
    adminRole,
    memberRole,
    organization,
    ownerMembership,
    ownerProfileId,
    ownerRole,
    prisma,
    secondTargetMembership,
    targetMembership,
    targetProfileId,
  }
}

describe('Organization ownership invariant and transfer (M-088)', () => {
  beforeAll(async () => {
    assertOrganizationsTestDatabase()
    await cleanup()
  })

  afterEach(cleanup)
  afterAll(cleanup)

  it('rejects an Organization transaction that commits without an OWNER', async () => {
    const { prisma } = await import('@/lib/prisma')
    await expect(
      prisma.organization.create({
        data: {
          name: 'Ownerless Organization',
          slug: createOrganizationTestSlug(TEST_PREFIX),
        },
      })
    ).rejects.toBeTruthy()
  })

  it('rejects every write that would remove the sole OWNER or add a second', async () => {
    const context = await createContext()

    await expect(
      context.prisma.organizationMembership.update({
        where: { id: context.targetMembership.id },
        data: { roleId: context.ownerRole.id },
      })
    ).rejects.toBeTruthy()

    await expect(
      context.prisma.organizationMembership.update({
        where: { id: context.ownerMembership.id },
        data: { status: 'REMOVED', removedAt: new Date() },
      })
    ).rejects.toBeTruthy()

    await expect(
      context.prisma.organizationMembership.update({
        where: { id: context.ownerMembership.id },
        data: { status: 'SUSPENDED', suspendedAt: new Date() },
      })
    ).rejects.toBeTruthy()

    await expect(
      context.prisma.organizationMembership.update({
        where: { id: context.ownerMembership.id },
        data: { roleId: context.adminRole.id },
      })
    ).rejects.toBeTruthy()

    await expect(
      context.prisma.organizationMembership.delete({
        where: { id: context.ownerMembership.id },
      })
    ).rejects.toBeTruthy()
  })

  it('preserves ownership across Organization lifecycle states and Role semantics', async () => {
    const context = await createContext()

    for (const status of ['SUSPENDED', 'ARCHIVED', 'ACTIVE'] as const) {
      await expect(
        context.prisma.organization.update({
          where: { id: context.organization.id },
          data: { status },
        })
      ).resolves.toMatchObject({ status })
      await expect(
        context.prisma.organizationMembership.count({
          where: {
            organizationId: context.organization.id,
            status: 'ACTIVE',
            role: { key: 'OWNER' },
          },
        })
      ).resolves.toBe(1)
    }

    await expect(
      context.prisma.role.update({
        where: { id: context.ownerRole.id },
        data: { key: `OWNER_RENAMED_${randomUUID().slice(0, 8)}` },
      })
    ).rejects.toBeTruthy()
  })

  it('atomically transfers OWNER and applies the explicit previous-owner Role', async () => {
    const context = await createContext()
    const transfer = createTransferOrganizationOwnershipService(
      createAuthorizedRunner(context.ownerProfileId, context.prisma)
    )

    const result = await transfer({
      organizationId: context.organization.id,
      targetMembershipId: context.targetMembership.id,
      previousOwnerRoleId: context.adminRole.id,
    })

    expect(result.previousOwner).toMatchObject({
      id: context.ownerMembership.id,
      roleId: context.adminRole.id,
      status: 'ACTIVE',
    })
    expect(result.newOwner).toMatchObject({
      id: context.targetMembership.id,
      roleId: context.ownerRole.id,
      status: 'ACTIVE',
    })
    await expect(
      context.prisma.organizationMembership.count({
        where: {
          organizationId: context.organization.id,
          status: 'ACTIVE',
          role: { key: 'OWNER' },
        },
      })
    ).resolves.toBe(1)
  })

  it('requires an existing non-OWNER Role for the previous OWNER', async () => {
    const context = await createContext()
    const transfer = createTransferOrganizationOwnershipService(
      createAuthorizedRunner(context.ownerProfileId, context.prisma)
    )

    await expect(
      transfer({
        organizationId: context.organization.id,
        targetMembershipId: context.targetMembership.id,
        previousOwnerRoleId: context.ownerRole.id,
      })
    ).rejects.toMatchObject({
      name: 'MembershipError',
      code: MEMBERSHIP_ERROR_CODES.OWNER_TRANSFER_REQUIRED,
    })

    await expect(
      transfer({
        organizationId: context.organization.id,
        targetMembershipId: context.targetMembership.id,
        previousOwnerRoleId: randomUUID(),
      })
    ).rejects.toMatchObject({
      name: 'MembershipError',
      code: MEMBERSHIP_ERROR_CODES.ROLE_INVALID,
    })
  })

  it('rejects transfer attempts from an active non-OWNER actor', async () => {
    const context = await createContext()
    const transfer = createTransferOrganizationOwnershipService(
      createAuthorizedRunner(context.targetProfileId, context.prisma)
    )

    await expect(
      transfer({
        organizationId: context.organization.id,
        targetMembershipId: context.secondTargetMembership.id,
        previousOwnerRoleId: context.adminRole.id,
      })
    ).rejects.toMatchObject({
      name: 'PermissionError',
      code: PERMISSION_ERROR_CODES.DENIED,
    })
  })

  it('allows only one concurrent transfer to determine the final OWNER', async () => {
    const context = await createContext()
    const firstClient = createIndependentTestClient()
    const secondClient = createIndependentTestClient()
    const firstTransfer = createTransferOrganizationOwnershipService(
      createAuthorizedRunner(context.ownerProfileId, firstClient)
    )
    const secondTransfer = createTransferOrganizationOwnershipService(
      createAuthorizedRunner(context.ownerProfileId, secondClient)
    )

    try {
      const results = await Promise.allSettled([
        firstTransfer({
          organizationId: context.organization.id,
          targetMembershipId: context.targetMembership.id,
          previousOwnerRoleId: context.adminRole.id,
        }),
        secondTransfer({
          organizationId: context.organization.id,
          targetMembershipId: context.secondTargetMembership.id,
          previousOwnerRoleId: context.adminRole.id,
        }),
      ])

      expect(
        results.filter(({ status }) => status === 'fulfilled')
      ).toHaveLength(1)
      expect(
        results.filter(({ status }) => status === 'rejected')
      ).toHaveLength(1)
      await expect(
        context.prisma.organizationMembership.count({
          where: {
            organizationId: context.organization.id,
            status: 'ACTIVE',
            role: { key: 'OWNER' },
          },
        })
      ).resolves.toBe(1)
    } finally {
      await Promise.all([
        firstClient.$disconnect(),
        secondClient.$disconnect(),
      ])
    }
  })

  it('does not permit transfer without the dedicated Permission', async () => {
    expect(PERMISSION_KEYS.ORGANIZATIONS_TRANSFER_OWNERSHIP).toBe(
      'organizations.transfer_ownership'
    )
  })
})
