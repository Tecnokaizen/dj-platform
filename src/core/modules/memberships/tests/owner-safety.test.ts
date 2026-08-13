import { randomUUID } from 'node:crypto'

import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest'

import { createFindProfileIdByNormalizedAuthEmail } from '@/core/identity/profile/services/find-profile-id-by-normalized-auth-email'
import {
  MEMBERSHIP_ERROR_CODES,
  MembershipError,
} from '@/core/modules/memberships/errors/membership-error'
import { createInvitationRepository } from '@/core/modules/memberships/repositories/invitation-repository'
import { createMembershipRepository } from '@/core/modules/memberships/repositories/membership-repository'
import {
  generateInvitationToken,
  hashInvitationToken,
} from '@/core/modules/memberships/security/invitation-token'
import { createChangeMembershipRoleService } from '@/core/modules/memberships/services/change-membership-role'
import { createInvitationService } from '@/core/modules/memberships/services/create-invitation'
import { createMembership } from '@/core/modules/memberships/services/create-membership'
import {
  createInvitationLifecycleSupport,
  INVITATION_LIFETIME_HOURS,
} from '@/core/modules/memberships/services/invitation-lifecycle-support'
import { isOwnerRole } from '@/core/modules/memberships/services/owner-safety'
import { membershipLifecycleSupport } from '@/core/modules/memberships/services/membership-lifecycle-support'
import { createRemoveMembershipService } from '@/core/modules/memberships/services/remove-membership'
import { restoreRemovedMembership } from '@/core/modules/memberships/services/restore-removed-membership'
import { createSuspendMembershipService } from '@/core/modules/memberships/services/suspend-membership'
import { assertOrganizationsTestDatabase } from '@/core/modules/organizations/tests/assert-test-database'

const TEST_PREFIX = 'm055-m059-test-'
const INITIAL_NOW = new Date('2026-08-11T12:00:00.000Z')
const changeMembershipRole = createChangeMembershipRoleService(
  membershipLifecycleSupport,
)
const removeMembership = createRemoveMembershipService(
  membershipLifecycleSupport,
)
const suspendMembership = createSuspendMembershipService(
  membershipLifecycleSupport,
)

async function expectOwnerTransferRequired(
  promise: Promise<unknown>,
): Promise<void> {
  try {
    await promise
    expect.unreachable('Expected MembershipError to be thrown')
  } catch (error) {
    expect(error).toBeInstanceOf(MembershipError)
    expect((error as MembershipError).code).toBe(
      MEMBERSHIP_ERROR_CODES.OWNER_TRANSFER_REQUIRED,
    )
  }
}

async function cleanupOwnerSafetyRecords(): Promise<void> {
  assertOrganizationsTestDatabase()

  const { prisma } = await import('@/lib/prisma')
  const organizations = await prisma.organization.findMany({
    where: {
      slug: {
        startsWith: TEST_PREFIX,
      },
    },
    select: {
      id: true,
    },
  })
  const organizationIds = organizations.map(({ id }) => id)

  if (organizationIds.length > 0) {
    await prisma.organizationInvitation.deleteMany({
      where: {
        organizationId: {
          in: organizationIds,
        },
      },
    })
    await prisma.organizationMembership.deleteMany({
      where: {
        organizationId: {
          in: organizationIds,
        },
      },
    })
    await prisma.organization.deleteMany({
      where: {
        id: {
          in: organizationIds,
        },
      },
    })
  }

  await prisma.profile.deleteMany({
    where: {
      username: {
        startsWith: TEST_PREFIX,
      },
    },
  })
}

async function createTestContext() {
  const { prisma } = await import('@/lib/prisma')
  const { seedSystemRoles } =
    await import('@/core/modules/roles/seed/seed-system-roles')

  await seedSystemRoles(prisma)

  const [ownerRole, adminRole, memberRole] = await Promise.all([
    prisma.role.findUniqueOrThrow({ where: { key: 'OWNER' } }),
    prisma.role.findUniqueOrThrow({ where: { key: 'ADMIN' } }),
    prisma.role.findUniqueOrThrow({ where: { key: 'MEMBER' } }),
  ])
  const suffix = randomUUID().slice(0, 18)
  const ownerProfileId = randomUUID()
  const memberProfileId = randomUUID()
  const removedProfileId = randomUUID()
  const candidateProfileId = randomUUID()
  const [organization] = await Promise.all([
    prisma.organization.create({
      data: {
        name: 'OWNER Safety Test',
        slug: `${TEST_PREFIX}${suffix}`,
      },
    }),
    prisma.profile.create({
      data: {
        id: ownerProfileId,
        username: `${TEST_PREFIX}owner-${suffix}`,
      },
    }),
    prisma.profile.create({
      data: {
        id: memberProfileId,
        username: `${TEST_PREFIX}member-${suffix}`,
      },
    }),
    prisma.profile.create({
      data: {
        id: removedProfileId,
        username: `${TEST_PREFIX}removed-${suffix}`,
      },
    }),
    prisma.profile.create({
      data: {
        id: candidateProfileId,
        username: `${TEST_PREFIX}candidate-${suffix}`,
      },
    }),
  ])
  const [ownerMembership, memberMembership, removedMembership] =
    await Promise.all([
      prisma.organizationMembership.create({
        data: {
          organizationId: organization.id,
          profileId: ownerProfileId,
          roleId: ownerRole.id,
          status: 'ACTIVE',
        },
      }),
      prisma.organizationMembership.create({
        data: {
          organizationId: organization.id,
          profileId: memberProfileId,
          roleId: memberRole.id,
          status: 'ACTIVE',
        },
      }),
      prisma.organizationMembership.create({
        data: {
          organizationId: organization.id,
          profileId: removedProfileId,
          roleId: adminRole.id,
          status: 'REMOVED',
          removedAt: INITIAL_NOW,
        },
      }),
    ])
  const invitationSupport = createInvitationLifecycleSupport({
    invitationRepository: createInvitationRepository(prisma),
    membershipRepository: createMembershipRepository(prisma),
    runInTransaction: (operation) =>
      prisma.$transaction((client) =>
        operation({
          invitationRepository: createInvitationRepository(client),
          membershipRepository: createMembershipRepository(client),
          findProfileIdByNormalizedAuthEmail:
            createFindProfileIdByNormalizedAuthEmail(client),
          findOrganizationById: (organizationId) =>
            client.organization.findUnique({ where: { id: organizationId } }),
          findRoleById: (roleId) =>
            client.role.findUnique({ where: { id: roleId } }),
        }),
      ),
    getCurrentActorProfileId: async () => memberProfileId,
    getCurrentRecipientIdentity: async () => ({
      profileId: memberProfileId,
      email: 'member@example.com',
    }),
    findOrganizationById: (organizationId) =>
      prisma.organization.findUnique({ where: { id: organizationId } }),
    findRoleById: (roleId) => prisma.role.findUnique({ where: { id: roleId } }),
    generateInvitationToken,
    hashInvitationToken,
    invitationLifetimeMs: INVITATION_LIFETIME_HOURS * 60 * 60 * 1000,
    now: () => new Date(INITIAL_NOW),
  })

  return {
    adminRole,
    candidateProfileId,
    createInvitation: createInvitationService(invitationSupport),
    memberMembership,
    memberRole,
    organization,
    ownerMembership,
    ownerRole,
    prisma,
    removedMembership,
  }
}

describe('OWNER safety foundation (M-055 → M-059)', () => {
  beforeAll(async () => {
    assertOrganizationsTestDatabase()
    await cleanupOwnerSafetyRecords()
  })

  afterEach(async () => {
    await cleanupOwnerSafetyRecords()
  })

  afterAll(async () => {
    await cleanupOwnerSafetyRecords()
  })

  it('detects canonical OWNER semantics exclusively through Role.key', async () => {
    const context = await createTestContext()

    expect(isOwnerRole(context.ownerRole)).toBe(true)
    expect(isOwnerRole(context.adminRole)).toBe(false)
    expect(isOwnerRole(context.memberRole)).toBe(false)
  })

  it('protects the active OWNER from suspension, removal and normal demotion', async () => {
    const context = await createTestContext()

    await expectOwnerTransferRequired(
      suspendMembership(context.ownerMembership.id),
    )
    await expectOwnerTransferRequired(
      removeMembership(context.ownerMembership.id),
    )
    await expectOwnerTransferRequired(
      changeMembershipRole({
        membershipId: context.ownerMembership.id,
        roleId: context.adminRole.id,
      }),
    )

    await expect(
      context.prisma.organizationMembership.findUniqueOrThrow({
        where: { id: context.ownerMembership.id },
      }),
    ).resolves.toMatchObject({
      roleId: context.ownerRole.id,
      status: 'ACTIVE',
      suspendedAt: null,
      removedAt: null,
    })
  })

  it('rejects OWNER promotion through normal create, restore and Role-change paths', async () => {
    const context = await createTestContext()

    await expectOwnerTransferRequired(
      createMembership({
        organizationId: context.organization.id,
        profileId: context.candidateProfileId,
        roleId: context.ownerRole.id,
      }),
    )
    await expectOwnerTransferRequired(
      restoreRemovedMembership({
        membershipId: context.removedMembership.id,
        targetRoleId: context.ownerRole.id,
      }),
    )
    await expectOwnerTransferRequired(
      changeMembershipRole({
        membershipId: context.memberMembership.id,
        roleId: context.ownerRole.id,
      }),
    )

    const ownerMemberships =
      await context.prisma.organizationMembership.findMany({
        where: {
          organizationId: context.organization.id,
          roleId: context.ownerRole.id,
        },
      })

    expect(ownerMemberships).toHaveLength(1)
    expect(ownerMemberships[0]?.id).toBe(context.ownerMembership.id)
  })

  it('rejects OWNER assignment through the normal invitation path', async () => {
    const context = await createTestContext()

    await expectOwnerTransferRequired(
      context.createInvitation({
        organizationId: context.organization.id,
        recipientEmail: 'candidate@example.com',
        roleId: context.ownerRole.id,
      }),
    )

    await expect(
      context.prisma.organizationInvitation.count({
        where: {
          organizationId: context.organization.id,
        },
      }),
    ).resolves.toBe(0)
  })
})
