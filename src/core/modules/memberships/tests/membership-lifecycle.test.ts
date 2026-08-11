import { randomUUID } from 'node:crypto'

import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest'

import {
  PROFILE_ERROR_CODES,
  ProfileError,
} from '@/core/identity/profile/errors/profile-error'
import {
  MEMBERSHIP_ERROR_CODES,
  MembershipError,
  type MembershipErrorCode,
} from '@/core/modules/memberships/errors/membership-error'
import {
  ORGANIZATION_ERROR_CODES,
  OrganizationError,
} from '@/core/modules/organizations/errors/organization-error'
import { assertOrganizationsTestDatabase } from '@/core/modules/organizations/tests/assert-test-database'

const TEST_PREFIX = 'm033-m038-test-'

type TestContext = {
  organizationId: string
  profileId: string
  memberRoleId: string
  adminRoleId: string
  ownerRoleId: string
}

async function expectMembershipError(
  promise: Promise<unknown>,
  code: MembershipErrorCode
): Promise<void> {
  try {
    await promise
    expect.unreachable('Expected MembershipError to be thrown')
  } catch (error) {
    expect(error).toBeInstanceOf(MembershipError)
    expect((error as MembershipError).code).toBe(code)
  }
}

async function cleanupMembershipLifecycleRecords(): Promise<void> {
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

async function createTestContext(): Promise<TestContext> {
  const { prisma } = await import('@/lib/prisma')
  const { seedSystemRoles } = await import(
    '@/core/modules/roles/seed/seed-system-roles'
  )

  await seedSystemRoles(prisma)

  const [memberRole, adminRole, ownerRole] = await Promise.all([
    prisma.role.findUniqueOrThrow({ where: { key: 'MEMBER' } }),
    prisma.role.findUniqueOrThrow({ where: { key: 'ADMIN' } }),
    prisma.role.findUniqueOrThrow({ where: { key: 'OWNER' } }),
  ])
  const profileId = randomUUID()
  const suffix = randomUUID().slice(0, 20)
  const [organization] = await Promise.all([
    prisma.organization.create({
      data: {
        name: 'Membership Lifecycle Test',
        slug: `${TEST_PREFIX}${suffix}`,
      },
    }),
    prisma.profile.create({
      data: {
        id: profileId,
        username: `${TEST_PREFIX}${suffix}`,
      },
    }),
  ])

  return {
    organizationId: organization.id,
    profileId,
    memberRoleId: memberRole.id,
    adminRoleId: adminRole.id,
    ownerRoleId: ownerRole.id,
  }
}

async function createMembershipForTest(
  context: TestContext,
  roleId = context.memberRoleId
) {
  const { createMembership } = await import(
    '@/core/modules/memberships/services/create-membership'
  )

  return createMembership({
    organizationId: context.organizationId,
    profileId: context.profileId,
    roleId,
  })
}

describe('Membership lifecycle services (M-033 → M-038)', () => {
  beforeAll(async () => {
    assertOrganizationsTestDatabase()
    await cleanupMembershipLifecycleRecords()
  })

  afterEach(async () => {
    await cleanupMembershipLifecycleRecords()
  })

  afterAll(async () => {
    await cleanupMembershipLifecycleRecords()
  })

  it('creates an ACTIVE non-OWNER Membership with a stable DTO', async () => {
    const context = await createTestContext()
    const created = await createMembershipForTest(context)

    expect(created).toMatchObject({
      organizationId: context.organizationId,
      profileId: context.profileId,
      roleId: context.memberRoleId,
      status: 'ACTIVE',
      suspendedAt: null,
      removedAt: null,
    })
    expect(created.createdAt).toEqual(expect.any(String))
    expect(created.updatedAt).toEqual(expect.any(String))
  })

  it('rejects duplicate Membership creation predictably', async () => {
    const context = await createTestContext()
    await createMembershipForTest(context)

    await expectMembershipError(
      createMembershipForTest(context),
      MEMBERSHIP_ERROR_CODES.ALREADY_EXISTS
    )
  })

  it('validates Organization, Profile, Role and OWNER creation boundaries', async () => {
    const context = await createTestContext()
    const { prisma } = await import('@/lib/prisma')
    const { createMembership } = await import(
      '@/core/modules/memberships/services/create-membership'
    )

    await expectMembershipError(
      createMembershipForTest(context, context.ownerRoleId),
      MEMBERSHIP_ERROR_CODES.OWNER_TRANSFER_REQUIRED
    )
    await expectMembershipError(
      createMembership({
        organizationId: context.organizationId,
        profileId: context.profileId,
        roleId: randomUUID(),
      }),
      MEMBERSHIP_ERROR_CODES.ROLE_INVALID
    )

    try {
      await createMembership({
        organizationId: context.organizationId,
        profileId: randomUUID(),
        roleId: context.memberRoleId,
      })
      expect.unreachable('Expected missing Profile to be rejected')
    } catch (error) {
      expect(error).toBeInstanceOf(ProfileError)
      expect((error as ProfileError).code).toBe(PROFILE_ERROR_CODES.NOT_FOUND)
    }

    await prisma.organization.update({
      where: { id: context.organizationId },
      data: { status: 'SUSPENDED' },
    })

    try {
      await createMembershipForTest(context)
      expect.unreachable('Expected inactive Organization to be rejected')
    } catch (error) {
      expect(error).toBeInstanceOf(OrganizationError)
      expect((error as OrganizationError).code).toBe(
        ORGANIZATION_ERROR_CODES.INVALID_STATE
      )
    }
  })

  it('suspends ACTIVE Memberships while preserving Role assignment', async () => {
    const context = await createTestContext()
    const created = await createMembershipForTest(context)
    const { suspendMembership } = await import(
      '@/core/modules/memberships/services/suspend-membership'
    )

    const suspended = await suspendMembership(created.id)

    expect(suspended.status).toBe('SUSPENDED')
    expect(suspended.roleId).toBe(context.memberRoleId)
    expect(suspended.suspendedAt).toEqual(expect.any(String))
    expect(suspended.removedAt).toBeNull()

    await expectMembershipError(
      suspendMembership(created.id),
      MEMBERSHIP_ERROR_CODES.SUSPENDED
    )
  })

  it('protects OWNER Memberships from direct suspension and removal', async () => {
    const context = await createTestContext()
    const { prisma } = await import('@/lib/prisma')
    const { suspendMembership } = await import(
      '@/core/modules/memberships/services/suspend-membership'
    )
    const { removeMembership } = await import(
      '@/core/modules/memberships/services/remove-membership'
    )
    const ownerMembership = await prisma.organizationMembership.create({
      data: {
        organizationId: context.organizationId,
        profileId: context.profileId,
        roleId: context.ownerRoleId,
      },
    })

    await expectMembershipError(
      suspendMembership(ownerMembership.id),
      MEMBERSHIP_ERROR_CODES.OWNER_TRANSFER_REQUIRED
    )
    await expectMembershipError(
      removeMembership(ownerMembership.id),
      MEMBERSHIP_ERROR_CODES.OWNER_TRANSFER_REQUIRED
    )
  })

  it('restores SUSPENDED Memberships only while Organization is ACTIVE', async () => {
    const context = await createTestContext()
    const created = await createMembershipForTest(context)
    const { prisma } = await import('@/lib/prisma')
    const { suspendMembership } = await import(
      '@/core/modules/memberships/services/suspend-membership'
    )
    const { restoreMembership } = await import(
      '@/core/modules/memberships/services/restore-membership'
    )

    await suspendMembership(created.id)
    await prisma.organization.update({
      where: { id: context.organizationId },
      data: { status: 'SUSPENDED' },
    })

    await expect(restoreMembership(created.id)).rejects.toMatchObject({
      name: 'OrganizationError',
      code: ORGANIZATION_ERROR_CODES.INVALID_STATE,
    })

    await prisma.organization.update({
      where: { id: context.organizationId },
      data: { status: 'ACTIVE' },
    })

    const restored = await restoreMembership(created.id)
    expect(restored.status).toBe('ACTIVE')
    expect(restored.roleId).toBe(context.memberRoleId)
    expect(restored.suspendedAt).toBeNull()
    expect(restored.removedAt).toBeNull()
  })

  it('removes ACTIVE and SUSPENDED Memberships without hard deletion', async () => {
    const activeContext = await createTestContext()
    const active = await createMembershipForTest(activeContext)
    const suspendedContext = await createTestContext()
    const suspended = await createMembershipForTest(suspendedContext)
    const { prisma } = await import('@/lib/prisma')
    const { suspendMembership } = await import(
      '@/core/modules/memberships/services/suspend-membership'
    )
    const { removeMembership } = await import(
      '@/core/modules/memberships/services/remove-membership'
    )

    await suspendMembership(suspended.id)

    for (const membershipId of [active.id, suspended.id]) {
      const removed = await removeMembership(membershipId)
      expect(removed.status).toBe('REMOVED')
      expect(removed.suspendedAt).toBeNull()
      expect(removed.removedAt).toEqual(expect.any(String))
      expect(
        await prisma.organizationMembership.findUnique({
          where: { id: membershipId },
        })
      ).not.toBeNull()
    }
  })

  it('restores a REMOVED Membership with an explicit validated Role', async () => {
    const context = await createTestContext()
    const created = await createMembershipForTest(context)
    const { removeMembership } = await import(
      '@/core/modules/memberships/services/remove-membership'
    )
    const { restoreRemovedMembership } = await import(
      '@/core/modules/memberships/services/restore-removed-membership'
    )

    await removeMembership(created.id)

    await expectMembershipError(
      restoreRemovedMembership({
        membershipId: created.id,
        targetRoleId: context.ownerRoleId,
      }),
      MEMBERSHIP_ERROR_CODES.OWNER_TRANSFER_REQUIRED
    )

    const restored = await restoreRemovedMembership({
      membershipId: created.id,
      targetRoleId: context.adminRoleId,
    })

    expect(restored.id).toBe(created.id)
    expect(restored.status).toBe('ACTIVE')
    expect(restored.roleId).toBe(context.adminRoleId)
    expect(restored.suspendedAt).toBeNull()
    expect(restored.removedAt).toBeNull()
  })

  it('changes Role only for ACTIVE non-OWNER Memberships', async () => {
    const context = await createTestContext()
    const created = await createMembershipForTest(context)
    const { changeMembershipRole } = await import(
      '@/core/modules/memberships/services/change-membership-role'
    )
    const { suspendMembership } = await import(
      '@/core/modules/memberships/services/suspend-membership'
    )

    await expectMembershipError(
      changeMembershipRole({
        membershipId: created.id,
        roleId: context.ownerRoleId,
      }),
      MEMBERSHIP_ERROR_CODES.OWNER_TRANSFER_REQUIRED
    )

    const changed = await changeMembershipRole({
      membershipId: created.id,
      roleId: context.adminRoleId,
    })
    expect(changed.roleId).toBe(context.adminRoleId)

    await suspendMembership(created.id)
    await expectMembershipError(
      changeMembershipRole({
        membershipId: created.id,
        roleId: context.memberRoleId,
      }),
      MEMBERSHIP_ERROR_CODES.SUSPENDED
    )
  })
})
