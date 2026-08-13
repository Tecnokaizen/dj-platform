import { randomUUID } from 'node:crypto'

import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest'

import { createMembershipRepository } from '@/core/modules/memberships/repositories/membership-repository'
import { ORGANIZATION_ERROR_CODES } from '@/core/modules/organizations/errors/organization-error'
import { createAuthorizedReactivateOrganizationService } from '@/core/modules/organizations/services/reactivate-organization'
import { createAuthorizedRestoreOrganizationService } from '@/core/modules/organizations/services/restore-organization'
import { createResolveOrganizationContextService } from '@/core/modules/organizations/services/switch-active-organization'
import { organizationSelect } from '@/core/modules/organizations/persistence/organization-select'
import {
  assertOrganizationsTestDatabase,
  createOrganizationTestSlug,
} from '@/core/modules/organizations/tests/assert-test-database'
import {
  createOwnedOrganizationTestRecord,
  deleteOrganizationTestRecords,
} from '@/core/modules/organizations/tests/organization-owner-fixture'
import { PERMISSION_ERROR_CODES } from '@/core/modules/permissions/errors/permission-error'
import { createRolePermissionRepository } from '@/core/modules/permissions/repositories/role-permission-repository'
import { createPermissionAuthorizationServices } from '@/core/modules/permissions/services/permission-authorization'
import { createAuthorizedOrganizationOperationRunner } from '@/core/modules/permissions/services/require-organization-permission'
import { syncPermissionsFoundation } from '@/core/modules/permissions/seed/sync-permissions-foundation'
import { seedSystemRoles } from '@/core/modules/roles/seed/seed-system-roles'
import type { Prisma, PrismaClient } from '@/generated/prisma/client'

const TEST_PREFIX = 'o-lifecycle-authz-'

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

async function createActor(roleKey: 'OWNER' | 'MEMBER') {
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
      name: 'Lifecycle Authz Org',
      slug: createOrganizationTestSlug(TEST_PREFIX),
    },
    roleKey === 'OWNER' ? profileId : undefined
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

describe('Authorized Organization recovery lifecycle', () => {
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

  it('reactivates SUSPENDED Organization for an authorized OWNER', async () => {
    const { organization, profileId, prisma } = await createActor('OWNER')
    await prisma.organization.update({
      where: { id: organization.id },
      data: { status: 'SUSPENDED' },
    })

    const reactivate = createAuthorizedReactivateOrganizationService(
      createAuthorizedRunner(profileId, prisma)
    )
    const result = await reactivate(organization.id)

    expect(result).toMatchObject({ id: organization.id, status: 'ACTIVE' })
    await expect(
      prisma.organization.findUniqueOrThrow({ where: { id: organization.id } })
    ).resolves.toMatchObject({ status: 'ACTIVE', archivedAt: null })
  })

  it('denies reactivate for MEMBER without organizations.update', async () => {
    const { organization, profileId, prisma } = await createActor('MEMBER')
    await prisma.organization.update({
      where: { id: organization.id },
      data: { status: 'SUSPENDED' },
    })

    const reactivate = createAuthorizedReactivateOrganizationService(
      createAuthorizedRunner(profileId, prisma)
    )

    await expect(reactivate(organization.id)).rejects.toMatchObject({
      name: 'PermissionError',
      code: PERMISSION_ERROR_CODES.DENIED,
    })
    await expect(
      prisma.organization.findUniqueOrThrow({ where: { id: organization.id } })
    ).resolves.toMatchObject({ status: 'SUSPENDED' })
  })

  it('rejects reactivate for ACTIVE Organization', async () => {
    const { organization, profileId, prisma } = await createActor('OWNER')
    const reactivate = createAuthorizedReactivateOrganizationService(
      createAuthorizedRunner(profileId, prisma)
    )

    await expect(reactivate(organization.id)).rejects.toMatchObject({
      name: 'OrganizationError',
      code: ORGANIZATION_ERROR_CODES.INVALID_STATE,
    })
    await expect(
      prisma.organization.findUniqueOrThrow({ where: { id: organization.id } })
    ).resolves.toMatchObject({ status: 'ACTIVE' })
  })

  it('rejects reactivate for ARCHIVED Organization', async () => {
    const { organization, profileId, prisma } = await createActor('OWNER')
    await prisma.organization.update({
      where: { id: organization.id },
      data: { status: 'ARCHIVED', archivedAt: new Date() },
    })

    const reactivate = createAuthorizedReactivateOrganizationService(
      createAuthorizedRunner(profileId, prisma)
    )

    await expect(reactivate(organization.id)).rejects.toMatchObject({
      name: 'OrganizationError',
      code: ORGANIZATION_ERROR_CODES.INVALID_STATE,
    })
    await expect(
      prisma.organization.findUniqueOrThrow({ where: { id: organization.id } })
    ).resolves.toMatchObject({ status: 'ARCHIVED' })
  })

  it('restores ARCHIVED Organization for an authorized OWNER', async () => {
    const { organization, profileId, prisma } = await createActor('OWNER')
    await prisma.organization.update({
      where: { id: organization.id },
      data: { status: 'ARCHIVED', archivedAt: new Date() },
    })

    const restore = createAuthorizedRestoreOrganizationService(
      createAuthorizedRunner(profileId, prisma)
    )
    const result = await restore(organization.id)

    expect(result).toMatchObject({ id: organization.id, status: 'ACTIVE' })
    await expect(
      prisma.organization.findUniqueOrThrow({ where: { id: organization.id } })
    ).resolves.toMatchObject({ status: 'ACTIVE', archivedAt: null })
  })

  it('denies restore for MEMBER without organizations.update', async () => {
    const { organization, profileId, prisma } = await createActor('MEMBER')
    await prisma.organization.update({
      where: { id: organization.id },
      data: { status: 'ARCHIVED', archivedAt: new Date() },
    })

    const restore = createAuthorizedRestoreOrganizationService(
      createAuthorizedRunner(profileId, prisma)
    )

    await expect(restore(organization.id)).rejects.toMatchObject({
      name: 'PermissionError',
      code: PERMISSION_ERROR_CODES.DENIED,
    })
    await expect(
      prisma.organization.findUniqueOrThrow({ where: { id: organization.id } })
    ).resolves.toMatchObject({ status: 'ARCHIVED' })
  })

  it('rejects restore for ACTIVE Organization', async () => {
    const { organization, profileId, prisma } = await createActor('OWNER')
    const restore = createAuthorizedRestoreOrganizationService(
      createAuthorizedRunner(profileId, prisma)
    )

    await expect(restore(organization.id)).rejects.toMatchObject({
      name: 'OrganizationError',
      code: ORGANIZATION_ERROR_CODES.INVALID_STATE,
    })
    await expect(
      prisma.organization.findUniqueOrThrow({ where: { id: organization.id } })
    ).resolves.toMatchObject({ status: 'ACTIVE' })
  })

  it('rejects restore for SUSPENDED Organization', async () => {
    const { organization, profileId, prisma } = await createActor('OWNER')
    await prisma.organization.update({
      where: { id: organization.id },
      data: { status: 'SUSPENDED' },
    })

    const restore = createAuthorizedRestoreOrganizationService(
      createAuthorizedRunner(profileId, prisma)
    )

    await expect(restore(organization.id)).rejects.toMatchObject({
      name: 'OrganizationError',
      code: ORGANIZATION_ERROR_CODES.INVALID_STATE,
    })
    await expect(
      prisma.organization.findUniqueOrThrow({ where: { id: organization.id } })
    ).resolves.toMatchObject({ status: 'SUSPENDED' })
  })
})
